import * as $ from 'jquery';
import * as moment from 'moment';
import { toNumber, assign } from 'lodash';
import { Utilities, PlatformType } from '@microsoft/office-js-helpers';
import { generateUrl, processLibraries } from '../app/helpers/utilities';
import { Strings, setDisplayLanguage, getDisplayLanguageOrFake } from '../app/strings';
import { Messenger, MessageType } from '../app/helpers/messenger';
import '../assets/styles/extras.scss';

interface InitializationParams {
    origin: string;
    officeJS: string;
    returnUrl: string;
    heartbeatParams: HeartbeatParams,
    explicitlySetDisplayLanguageOrNull: string;
}

(() => {
    /** Namespaces for the runner wrapper to share with the inner snippet iframe */
    const officeNamespacesForIframe = ['OfficeExtension', 'OfficeCore', 'Excel', 'Word', 'OneNote'];

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

            if (params.explicitlySetDisplayLanguageOrNull) {
                setDisplayLanguage(params.explicitlySetDisplayLanguageOrNull);
                document.cookie = `displayLanguage=${encodeURIComponent(params.explicitlySetDisplayLanguageOrNull)};path=/;`;
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

                replaceSnippetIframe(snippetHtml, params.officeJS);
            }

            establishHeartbeat(params.origin, params.heartbeatParams);

            $('#sync-with-editor').click(() => clearAndRefresh(null /*id*/, null /*name*/));

            initializeTooltipUpdater();

            // create an observer for firebug resizing
            (new MutationObserver(mutations => mutations.forEach(snippetAndConsoleRefreshSize)))
                .observe(document.getElementById('FirebugUI'), { attributes: true });
        }
    }

    (window as any).initializeRunner = initializeRunner;


    /** Creates a snippet iframe and returns it (still hidden) */
    function replaceSnippetIframe(html: string, officeJS: string): void {
        showHeader();

        // Remove any previous iFrames (if any) or the placeholder snippet-frame div
        $('.snippet-frame').remove();

        const $emptySnippetPlaceholder = $('<div class="snippet-frame"></div>')
            .insertAfter($snippetContent);

        const $iframe =
            $('<iframe class="snippet-frame" style="display:none" src="about:blank"></iframe>')
                .insertAfter($snippetContent);

        const iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        (window as any).scriptRunnerBeginInit = () => {
            (contentWindow as any).console = window.console;
            contentWindow.onerror = (...args) => console.error(args);

            if (officeJS) {
                contentWindow['Office'] = window['Office'];
                officeNamespacesForIframe.forEach(namespace => contentWindow[namespace] = window[namespace]);
            }

            $emptySnippetPlaceholder.remove();
            $iframe.show();
            toggleProgress(false);
            snippetAndConsoleRefreshSize();
        };

        (window as any).scriptRunnerEndInit = () => {
            if (officeJS) {
                // Call Office.initialize(), which now initializes the snippet.
                // The parameter, initializationReason, is not used in the playground.
                Office.initialize(null /*initializationReason*/);
            }
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
    }

    function handleError(error: Error) {
        let candidateErrorString = error.message || error.toString();
        if (candidateErrorString === '[object Object]') {
            candidateErrorString = Strings().Runner.unexpectedError;
        }

        $('#header-text').text('');
        showHeader();
        toggleProgressLoadingIndicators(false);

        const $error = $('#notify-error');

        $error.find('.ms-MessageBar-text').text(candidateErrorString);

        const $actionBack = $error.find('.action-back').off('click');
        if (returnUrl) {
            $actionBack.show().click(() => window.location.href = returnUrl);
        } else {
            $actionBack.hide();
        }

        $error.find('.action-fast-reload').off('click').click(() => {
            clearAndRefresh(null /*id*/, null /*name*/);
            $error.hide();
        });

        $error.find('.action-dismiss').off('click').click(() => {
            $('.runner-overlay').hide();
            $error.hide();
        });

        $('.runner-notification').hide();
        $('.runner-overlay').show();
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

        heartbeat.messenger.listen<{ name: string }>()
            .filter(({ type }) => type === MessageType.INFORM_STALE)
            .subscribe(input => {
                if (isListeningTo.currentSnippetContentChange) {
                    showReloadNotification($('#notify-current-snippet-changed'),
                        () => clearAndRefresh(currentSnippet.id, input.message.name),
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
                    $('.runner-overlay').hide();
                    $anotherSnippetSelected.hide();
                } else {
                    if (isListeningTo.snippetSwitching) {
                        $anotherSnippetSelected.find('.ms-MessageBar-text .snippet-name').text(input.message.name);
                        showReloadNotification($anotherSnippetSelected,
                            () => clearAndRefresh(input.message.id, input.message.name),
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
                    .always(() => {
                        $('.runner-overlay').hide();
                        $('.runner-notification').not('#notify-error').hide();
                    });
            });
    }

    function showReloadNotification($notificationContainer: JQuery, reloadAction: () => void, dismissAction: () => void) {
        $notificationContainer.find('.action-fast-reload').off('click').click(reloadAction);

        $notificationContainer.find('.action-dismiss').off('click').click(() => {
            $('.runner-overlay').hide();
            $notificationContainer.hide();
            dismissAction();
        });

        // Show the current notification (and hide any others)
        $('.runner-notification').hide();
        $('.runner-overlay').show();
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
            toggleProgress(true, Strings().Runner.reloadingOfficeJs);
            window.location.href = refreshUrl;
            return;
        }

        // If still here, proceed to render:

        $('#header-refresh').attr('href', refreshUrl);

        replaceSnippetIframe(html, processLibraries(snippet).officeJS);

        $('#header-text').text(snippet.name);
        currentSnippet.lastModified = snippet.modified_at;

        (window as any).Firebug.Console.clear();
    }

    /** Clear current snippet frame and send a refresh REFRESH_REQUEST
     * @param id: id of snippet, or null to fetch the last-opened
     * @param name: name of the snippet, or null to use a generic "loading snippet" text
     */
    function clearAndRefresh(id: string, name: string) {
        $('.runner-overlay').hide();
        $('.runner-notification').hide();

        toggleProgress(true, Strings().Runner.getLoadingSnippetSubtitle(name));

        // Remove the frame (in case had a timer or anything else that may as well get destroyed...)
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

    function toggleProgress(visible: boolean, subtitleText?: string) {
        if (visible) {
            if (subtitleText) {
                $('#subtitle').text(subtitleText);
            }
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
            const strings = Strings();
            const momentText = moment(currentSnippet.lastModified).locale(getDisplayLanguageOrFake()).fromNow();
            $headerTitle.attr('title', `${strings.HtmlPageStrings.lastUpdated} ${momentText}. ${strings.HtmlPageStrings.clickToRefresh}.`);
        }
    }

    function snippetAndConsoleRefreshSize() {
        const heightWithPxSuffix = document.getElementById('FirebugUI').style.height;
        const heightPixels = heightWithPxSuffix.substr(0, heightWithPxSuffix.length - 'px'.length);
        const flexProperties = ['-webkit-flex', '-ms-flex', 'flex'];

        // On Safari (and maybe others), need to reset the flex rule in order to cause a flex recomputation
        // Note: will be setting (overriding)( all of the "style" element, but as no one else touches it
        // or does a jQuery hide/show on it (or at least, it's OK to override), that is OK.
        const $snippetFrame = $('.snippet-frame');
        const $shadow = $('#firebug-shadow');

        $shadow.attr('style', '');
        $snippetFrame.attr('style', '');

        setTimeout(() => {
            $shadow.attr('style',
                flexProperties.map(prefix => `${prefix}: 0 0 ${heightPixels}px`).join('; ')
            );
            $snippetFrame.attr('style',
                flexProperties.map(prefix => `${prefix}: 1 1 1px`).join('; ')
            );
        }, 0);
    }

})();
