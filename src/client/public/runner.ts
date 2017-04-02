import * as $ from 'jquery';
import * as moment from 'moment';
import { toNumber, assign } from 'lodash';
import { Utilities, PlatformType } from '@microsoft/office-js-helpers';
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

    /**
     * A "pre" tag containing the original snippet content, and acting as a placemarker
     * for where to insert the rendered snippet iframe
     * */
    let $snippetContent: JQuery;

    let returnUrl = '';
    let host: string;

    let currentSnippet: { id: string, lastModified: number, officeJS: string };

    const defaultIsListeningTo = {
        snippetSwitching: true,
        currentSnippetContentChange: true
    };

    const isListeningTo = {} as any;
    assign(isListeningTo, defaultIsListeningTo);

    const heartbeat: {
        messenger: Messenger,
        window: Window
    } = <any>{};

    function initializeRunner(params: InitializationParams): void {
        try {
            initializeRunnerHelper();
        }
        catch (error) {
            handleError(error);
        }

        // Helper:
        async function initializeRunnerHelper() {
            if (params.returnUrl) {
                window.sessionStorage.playground_returnUrl = params.returnUrl;
            }

            if (window.sessionStorage.playground_returnUrl) {
                returnUrl = window.sessionStorage.playground_returnUrl;
                $('#header-back').attr('href', returnUrl).show();
            }

            returnUrl = params.returnUrl;
            host = params.heartbeatParams.host;

            currentSnippet = {
                id: params.heartbeatParams.id,
                lastModified: toNumber(params.heartbeatParams.lastModified),
                officeJS: params.officeJS
            };

            await Promise.all([
                loadFirebug(params.origin),
                ensureHostInitialized()
            ]);

            $('#header-refresh').attr('href', generateRefreshUrl(currentSnippet.officeJS));
            if (Utilities.platform === PlatformType.PC) {
                $('#padding-for-personality-menu').width('20px');
            } else if (Utilities.platform === PlatformType.MAC) {
                $('#padding-for-personality-menu').width('40px');
            }

            $snippetContent = $('#snippet-code-content');

            // Because it's a multiline text inside of a "pre" tag, trim it:
            const snippetHtml = $snippetContent.text().trim();

            if (snippetHtml.length > 0) {
                // Clear the text, but keep the placeholder in the DOM,
                // so that can keep adding the snippet frame relative to its position
                $snippetContent.text('');

                writeSnippetIframe(snippetHtml, params.officeJS);
            }

            establishHeartbeat(params.origin, params.heartbeatParams);

            $('#sync-with-editor').click(() => clearAndRefresh(null /*id*/));

            initializeTooltipUpdater();
        }
    }

    (window as any).initializeRunner = initializeRunner;


    /** Creates a snippet iframe and returns it (still hidden) */
    function writeSnippetIframe(html: string, officeJS: string): JQuery {
        showHeader();

        const $iframe =
            $('<iframe class="snippet-frame fullscreen" style="display:none" src="about:blank"></iframe>')
                .insertAfter($snippetContent);

        const iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        (window as any).scriptRunnerInitialized = () => {
            (contentWindow as any).console = window.console;
            contentWindow.onerror = (...args) => console.error(args);

            if (officeJS) {
                contentWindow['Office'] = window['Office'];
                officeNamespacesForIframe.forEach(namespace => contentWindow[namespace] = window[namespace]);

                // Call Office.initialize(), which now initializes the snippet.
                // The parameter, initializationReason, is not used in the Playground.
                Office.initialize(null /*initializationReason*/);
            }

            toggleProgress(false);
            $iframe.show();
        };

        // Write to the iframe (and note that must do the ".write" call first,
        // before setting any window properties). Setting console and onerror here
        // (for any initial logging or error handling from snippet-referenced libraries),
        // but for extra safety also setting them inside of scriptRunnerInitialized.
        contentWindow.document.open();
        contentWindow.document.write(html);
        (contentWindow as any).console = window.console;
        contentWindow.onerror = (...args) => console.error(args);
        contentWindow.document.close();

        return $iframe;
    }

    function handleError(error: Error) {
        let candidateErrorString = error.message || error.toString();
        if (candidateErrorString === '[object Object]') {
            candidateErrorString = Strings.Runner.unexpectedError;
        }

        $('#header-text').text('');
        showHeader();
        toggleProgressLoadingIndicators(false);

        // Hide other notifications:
        $('.runner-notification').hide();

        const $error = $('#notify-error');

        $error.find('.ms-MessageBar-text').text(candidateErrorString);

        const $actionBack = $error.find('.action-back').off('click');
        if (returnUrl) {
            $actionBack.show().click(() => window.location.href = returnUrl);
        } else {
            $actionBack.hide();
        }

        $error.find('.action-fast-reload').off('click').click(() => {
            clearAndRefresh(null /*id*/);
            $error.hide();
        });

        $error.find('.action-dismiss').off('click').click(() => {
            $error.hide();
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

        heartbeat.messenger = new Messenger(origin);
        heartbeat.window = ($iframe[0] as HTMLIFrameElement).contentWindow;

        heartbeat.messenger.listen<{ lastOpenedId: string }>()
            .filter(({ type }) => type === MessageType.HEARTBEAT_INITIALIZED)
            .subscribe(input => {
                if (input.message.lastOpenedId !== heartbeatParams.id) {
                    isListeningTo.snippetSwitching = false;
                }
            });

        heartbeat.messenger.listen<string>()
            .filter(({ type }) => type === MessageType.ERROR)
            .map(input => new Error(input.message))
            .subscribe(handleError);

        heartbeat.messenger.listen()
            .filter(({ type }) => type === MessageType.INFORM_STALE)
            .subscribe(() => {
                if (isListeningTo.currentSnippetContentChange) {
                    showReloadNotification($('#notify-current-snippet-changed'),
                        () => clearAndRefresh(currentSnippet.id),
                        () => isListeningTo.currentSnippetContentChange = false);
                }
            });

        heartbeat.messenger.listen<{ id: string, name: string }>()
            .filter(({ type }) => type === MessageType.INFORM_SWITCHED_SNIPPET)
            .subscribe(input => {
                const $anotherSnippetSelected = $('#notify-another-snippet-selected');
                // if switched back to the snippet that was already being tracked,
                // that's great, and just silently hide the previously-shown notification
                if (input.message.id === currentSnippet.id) {
                    $anotherSnippetSelected.hide();
                } else {
                    if (isListeningTo.snippetSwitching) {
                        $anotherSnippetSelected.find('.ms-MessageBar-text .snippet-name').text(input.message.name);
                        showReloadNotification($anotherSnippetSelected,
                            () => clearAndRefresh(input.message.id),
                            () => isListeningTo.snippetSwitching = false);
                    }
                }
            });

        heartbeat.messenger.listen<ISnippet>()
            .filter(({ type }) => type === MessageType.REFRESH_RESPONSE)
            .subscribe(input => {
                const snippet = input.message;
                const data = JSON.stringify({
                    snippet: snippet,
                    returnUrl: returnUrl
                });

                // Use jQuery post rather than the Utilities post here
                // (don't want to navigate, just to do an AJAX call)
                $.post(window.location.origin + '/compile/snippet', { data: data })
                    .then(html => processSnippetReload(html, snippet))
                    .fail(handleError)
                    .always(() => $('.runner-notification').not('#notify-error').hide());
            });
    }

    function showReloadNotification($notificationContainer: JQuery, reloadAction: () => void, dismissAction: () => void) {
        const $needsReloadIndicator = $notificationContainer.find('.reloading-indicator');
        const $needsReloadButtons = $notificationContainer.find('button');

        $notificationContainer.find('.action-fast-reload').off('click').click(() => {
            $needsReloadButtons.hide();
            $needsReloadIndicator.show();
            reloadAction();
        });

        $notificationContainer.find('.action-dismiss').off('click').click(() => {
            $notificationContainer.hide();
            dismissAction();
        });

        // Show the current notification (with the buttons visible, and the reloading indicator hidden)
        $('.runner-notification').hide();
        $needsReloadIndicator.hide();
        $needsReloadButtons.show();
        $notificationContainer.show();
    }

    function processSnippetReload(html: string, snippet: ISnippet) {
        const desiredOfficeJS = processLibraries(snippet).officeJS || '';
        const reloadDueToOfficeJSMismatch = (desiredOfficeJS !== currentSnippet.officeJS);

        currentSnippet = {
            id: snippet.id,
            lastModified: snippet.modified_at,
            officeJS: desiredOfficeJS
        };

        isListeningTo.currentSnippetContentChange = true;

        const refreshUrl = generateRefreshUrl(desiredOfficeJS);
        if (reloadDueToOfficeJSMismatch) {
            $('#subtitle').text(Strings.Runner.reloadingOfficeJs);
            toggleProgress(true);
            window.location.href = refreshUrl;
            return;
        }

        // If still here, proceed to render:

        $('#header-refresh').attr('href', refreshUrl);

        const $originalFrame = $('.snippet-frame');
        writeSnippetIframe(html, processLibraries(snippet).officeJS);
        $originalFrame.remove();

        $('#header-text').text(snippet.name);
        currentSnippet.lastModified = snippet.modified_at;

        (window as any).Firebug.Console.clear();
    }

    /** Clear current snippet frame and send a refresh REFRESH_REQUEST
     * @param id: id of snippet, or null to fetch the last-opened
     */
    function clearAndRefresh(id: string) {
        // From here on out, now that the page has loaded, adjust progress so that
        // it keeps the header visible -- and then show it
        toggleProgress(true);

        $('.snippet-frame').remove();

        if (id == null) {
            assign(isListeningTo, defaultIsListeningTo);
        }

        heartbeat.messenger.send(heartbeat.window, MessageType.REFRESH_REQUEST, id);
    }

    function generateRefreshUrl(desiredOfficeJS: string) {
        let refreshUrl = `${window.location.origin}/run/${host}/${currentSnippet.id}`;
        if (desiredOfficeJS) {
            refreshUrl += `?officeJS=${encodeURIComponent(desiredOfficeJS)}`;
        }

        return refreshUrl;
    }

    function toggleProgress(visible: boolean) {
        if (visible) {
            toggleProgressLoadingIndicators(true);
            $('#progress').show();
        } else {
            $('#progress').hide();
        }
    }

    /** Shows or hides loading subtitle and dots */
    function toggleProgressLoadingIndicators(visible: boolean) {
        $('#progress .cs-loader, #subtitle').css('visibility', visible ? 'visible' : 'hidden');
    }

    function showHeader() {
        $('#header').css('visibility', 'visible');
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
            // NEEDS STRING REVIEW (added "Click to refresh")
            $headerTitle.attr('title', `Last updated ${moment(currentSnippet.lastModified).fromNow()}. Click to refresh`);
        }
    }

})();
