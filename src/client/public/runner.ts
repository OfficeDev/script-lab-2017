import * as $ from 'jquery';
import * as moment from 'moment';
import { toNumber } from 'lodash';
import { generateUrl, processLibraries } from '../app/helpers/utilities';
import { Strings } from '../app/helpers';
import { Messenger, MessageType } from '../app/helpers/messenger';
import '../assets/styles/extras.scss';

interface InitializationParams {
    origin: string;
    officeJS: string;
    returnUrl: string;
    heartbeatParams: HeartbeatParams
}

(() => {
    /** Namespaces for the runner wrapper to share with the inner snippet iframe */
    const officeNamespacesForIframe = ['OfficeExtension', 'Excel', 'Word', 'OneNote'];

    let $snippetContent: JQuery;

    let returnUrl = '';
    let lastModified: number;
    let currentOfficeJS: string;

    const $needsReload = $('#notify-needs-reload');
    const $needsReloadIndicator = $needsReload.find('.reloading-indicator');
    const $needsReloadButtons = $needsReload.find('button');


    async function initializeRunner(params: InitializationParams) {
        try {
            const { origin, officeJS, heartbeatParams } = params;

            if (params.returnUrl) {
                window.sessionStorage.playground_returnUrl = params.returnUrl;
            }

            if (window.sessionStorage.playground_returnUrl) {
                returnUrl = window.sessionStorage.playground_returnUrl;
                $('#header-back').attr('href', returnUrl).show();
            }

            returnUrl = params.returnUrl;
            lastModified = toNumber(heartbeatParams.lastModified);
            currentOfficeJS = officeJS;

            await Promise.all([
                loadFirebug(origin),
                ensureHostInitialized()
            ]);

            $snippetContent = $('#snippet-code-content');
            const snippetHtml = $snippetContent.text();
            // Clear the text, but keep the placeholder in the DOM,
            // so that can add the snippet frame relative to its position
            $snippetContent.text('');

            if (snippetHtml.length > 0) {
                writeSnippetIframe(snippetHtml, officeJS);
            }

            establishHeartbeat(origin, heartbeatParams);

            initializeTooltipUpdater();
        }
        catch (error) {
            handleError(error);
        }
    }

    (window as any).initializeRunner = initializeRunner;


    /** Creates a snippet iframe and returns it (still hidden) */
    function writeSnippetIframe(html: string, officeJS: string): JQuery {
        const $iframe =
            $('<iframe class="snippet-frame fullscreen" style="display:none" src="about:blank"></iframe>')
                .insertAfter($snippetContent);

        const iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        // Write to the iframe (and note that must do the ".write" call first,
        // before setting any window properties)
        contentWindow.document.open();
        contentWindow.document.write(html);

        // Now proceed with setting window properties/callbacks:
        (contentWindow as any).console = window.console;
        if (officeJS) {
            contentWindow['Office'] = window['Office'];
        }

        contentWindow.onerror = (...args) => console.error(args);

        contentWindow.document.body.onload = () => {
            $iframe.show();

            $('#progress').hide();

            if (officeJS) {
                officeNamespacesForIframe.forEach(namespace => contentWindow[namespace] = window[namespace]);

                // Call Office.initialize(), which now initializes the snippet.
                // The parameter, initializationReason, is not used in the Playground.
                Office.initialize(null /*initializationReason*/);
            }
        };

        contentWindow.document.close();

        return $iframe;
    }

    function handleError(error: Error) {
        console.error(error);

        let candidateErrorString = error.message || error.toString();
        if (candidateErrorString === '[object Object]') {
            candidateErrorString = Strings.Runner.unexpectedError;
        }

        const $error = $('#notify-error');

        $error.find('.ms-MessageBar-text').text(candidateErrorString);

        const $actionBack = $error.find('.action-back').off('click');
        if (returnUrl) {
            $actionBack.show().click(() => window.location.href = returnUrl);
        } else {
            $actionBack.hide();
        }

        $error.find('.action-dismiss').off('click').click(() => {
            $error.hide();
            $('#heartbeat').remove();
        });

        $('#notify-error').show();
    }

    function loadFirebug(origin: string): Promise<void> {
        return new Promise<any>((resolve, reject) => {
            (window as any).origin = origin;
            const firebugUrl = `${origin}/assets/firebug/firebug-lite-debug.js#startOpened`;
            const script = $(`<script type="text/javascript" src="${firebugUrl}"></script>`);
            script.appendTo('head');

            const interval = setInterval(() => {
                if ((window as any).firebugLiteIsLoaded) {
                    clearInterval(interval);
                    return resolve((window as any).Firebug);
                }
            }, 100);
        });
    }

    async function ensureHostInitialized(): Promise<any> {
        // window.playground_host_ready is set within the runner template (embedded in html code)
        // when the host is ready (i.e., in Office.initialized callback, if Office host)
        if ((window as any).playground_host_ready) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if ((window as any).playground_host_ready) {
                    clearInterval(interval);
                    return resolve();
                }
            }, 100);
        });
    }

    function establishHeartbeat(origin: string, heartbeatParams: HeartbeatParams) {
        const $iframe = $('<iframe>', {
            src: generateUrl(`${origin}/heartbeat.html`, heartbeatParams),
            id: 'heartbeat'
        }).css('display', 'none').appendTo('body');
        const iframeWindow = ($iframe[0] as HTMLIFrameElement).contentWindow;

        const messenger = new Messenger(origin);

        messenger.listen()
            .filter(({ type }) => type === MessageType.ERROR)
            .map(input => input.message)
            .subscribe(handleError);

        messenger.listen()
            .filter(({ type }) => type === MessageType.INFORM_STALE)
            .subscribe(input => {
                $needsReloadIndicator.hide();
                $needsReloadButtons.show();

                $needsReload.find('.action-fast-reload').off('click').click(() => {
                    $needsReloadButtons.hide();
                    $needsReloadIndicator.show();
                    messenger.send(iframeWindow, MessageType.REFRESH_REQUEST, heartbeatParams.id);
                });

                $needsReload.find('.action-dismiss').off('click').click(() => {
                    $needsReload.hide();
                    $('#heartbeat').remove();
                });

                $needsReload.show();
            });

        messenger.listen()
            .filter(({ type }) => type === MessageType.REFRESH_RESPONSE)
            .subscribe(input => {
                const snippet = input.message as ISnippet;
                const data = JSON.stringify({
                    snippet: snippet,
                    returnUrl: returnUrl
                });

                // Use jQuery post rather than the Utilities post here
                // (don't want to navigate, just to do an AJAX call)
                $.post(window.location.origin + '/compile/snippet', { data: data })
                    .then(html => processSnippetReload(html, snippet))
                    .fail(handleError)
                    .always(() => $needsReload.hide());
            });
    }

    function processSnippetReload(html: string, snippet: ISnippet) {
        const desiredOfficeJs = processLibraries(snippet).officeJS || '';

        let refreshUrl = generateRefreshUrl();
        $('#header-refresh').attr('href', refreshUrl);
        if (desiredOfficeJs !== currentOfficeJS) {
            $('#subtitle').text(Strings.Runner.reloadingOfficeJs);
            $('#progress').show();
            window.location.href = refreshUrl;
            return;
        }

        // If still here, proceed to render:

        const $originalFrame = $('.snippet-frame');

        writeSnippetIframe(html, processLibraries(snippet).officeJS).show();

        $originalFrame.remove();

        $('#header-text').text(snippet.name);
        lastModified = snippet.modified_at;

        (window as any).Firebug.Console.clear();


        // Helper function

        function generateRefreshUrl() {
            let refreshUrl = `${window.location.origin}/run/${snippet.host}/${snippet.id}`;
            if (desiredOfficeJs) {
                refreshUrl += `?officeJS=${encodeURIComponent(desiredOfficeJs)}`;
            }
            return refreshUrl;
        }
    }

    function initializeTooltipUpdater() {
        moment.relativeTimeThreshold('s', 40);
        // Note, per documentation, "ss" must be set after "s"
        moment.relativeTimeThreshold('ss', 2);
        moment.relativeTimeThreshold('m', 40);
        moment.relativeTimeThreshold('h', 20);
        moment.relativeTimeThreshold('d', 25);
        moment.relativeTimeThreshold('M', 10);

        const $headerTitle = $('#header .command__center');

        $headerTitle.on('mouseover', refreshLastUpdatedText);

        function refreshLastUpdatedText() {
            $headerTitle.attr('title', `Last updated ${moment(lastModified).fromNow()}`);
        }
    }

})();
