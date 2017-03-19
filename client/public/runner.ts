import * as $ from 'jquery';
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

    let returnUrl: string;
    let $snippetContent: JQuery;

    async function initializeRunner(params: InitializationParams) {
        try {
            const { origin, officeJS, heartbeatParams } = params;
            returnUrl = params.returnUrl;

            const frameworkInitialized = createHostAwaiter(officeJS);

            await loadFirebug(origin);
            await frameworkInitialized;

            $snippetContent = $('#snippet-code-content');
            const snippetHtml = $snippetContent.text();
            // Clear the text, but keep the placeholder in the DOM,
            // so that can add the snippet frame relative to its position
            $snippetContent.text('');

            writeSnippetIframe(snippetHtml, officeJS);

            establishHeartbeat(origin, heartbeatParams);
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

        $error.find('.action-back').off('click').click(() =>
            window.location.href = returnUrl);

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
            }, 250);
        });
    }

    async function createHostAwaiter(officeJS: string): Promise<any> {
        if (officeJS) {
            return new Promise((resolve) => {
                Office.initialize = () => {
                    // Set initialize to an empty function -- that way, doesn't cause
                    // re-initialization of this page in case of a page like the error dialog,
                    // which doesn't defined (override) Office.initialize.
                    Office.initialize = () => { };

                    resolve();
                };
            });
        }
        else {
            return Promise.resolve();
        }
    }

    function establishHeartbeat(origin: string, heartbeatParams: HeartbeatParams) {
        $('<iframe>', {
            src: generateUrl(`${origin}/heartbeat.html`, heartbeatParams),
            id: 'heartbeat'
        }).css('display', 'none').appendTo('body');

        const messenger = new Messenger(location.origin);

        messenger.listen()
            .filter(({ type }) => type === MessageType.ERROR)
            .map(input => input.message)
            .subscribe(handleError);

        messenger.listen()
            .filter(({ type }) => type === MessageType.RELOAD)
            .subscribe(input => {
                const $needsReload = $('#notify-needs-reload');
                const $reloadingIndicator = $needsReload.find('#reloading-indicator').hide();
                const $buttons = $needsReload.find('button').show();

                $needsReload.find('.action-fast-reload').off('click').click(() => {
                    $reloadingIndicator.show();
                    $buttons.hide();

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

                $needsReload.find('.action-dismiss').off('click').click(() => {
                    $needsReload.hide();
                    $('#heartbeat').remove();
                });

                $needsReload.show();
            });
    }

    function processSnippetReload(html: string, snippet: ISnippet) {
        $('#header-text').text(snippet.name);

        const $originalFrame = $('.snippet-frame');

        writeSnippetIframe(html, processLibraries(snippet).officeJS).show();

        $originalFrame.remove();

        (window as any).Firebug.Console.clear();
    }
})();
