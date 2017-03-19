import * as $ from 'jquery';
import { generateUrl } from '../app/helpers/utilities';
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
    let returnUrl: string;

    async function initializeRunner(params: InitializationParams) {
        let { origin, officeJS, heartbeatParams } = params;
        returnUrl = params.returnUrl;

        let frameworkInitialized = createHostAwaiter(officeJS);

        const $iframe = $('#snippet-container');
        const $snippetContent = $('#snippet-code-content');
        const $progress = $('#progress');
        const $header = $('#header');
        const iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        try {
            await loadFirebug(origin);
            await frameworkInitialized;

            $iframe.show();
            $progress.hide();
            $header.show();

            const snippetHtml = $snippetContent.text();
            $snippetContent.remove();

            // Write to the iframe (and note that must do the ".write" call first,
            // before setting any window properties)
            contentWindow.document.open();
            contentWindow.document.write(snippetHtml);

            // Now proceed with setting window properties/callbacks:
            (contentWindow as any).console = window.console;
            if (officeJS) {
                contentWindow['Office'] = window['Office'];
            }
            contentWindow.onerror = (...args) => console.error(args);
            contentWindow.document.body.onload = () => {
                if (officeJS) {
                    const officeNamespacesToShare = ['OfficeExtension', 'Excel', 'Word', 'OneNote'];
                    officeNamespacesToShare.forEach(namespace => contentWindow[namespace] = window[namespace]);

                    // Call Office.initialize(), which now initializes the snippet.
                    // The parameter, initializationReason, is not used in the Playground.
                    Office.initialize(null /*initializationReason*/);
                }
            };

            contentWindow.document.close();

            establishHeartbeat(origin, heartbeatParams);
        }
        catch (error) {
            handleError(error);
        }
    }

    (window as any).initializeRunner = initializeRunner;


    function handleError(error: Error) {
        console.error(error);

        let candidateErrorString = error.message || error.toString();
        if (candidateErrorString === '[object Object]') {
            candidateErrorString = Strings.Runner.unexpectedError;
        }

        const $error = $('#notify-error');

        $error.find('.ms-MessageBar-text').text();

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

                $needsReload.find('.action-fast-reload').off('click').click(() => {
                    const $refreshIcon = $('#header .ms-Icon--Refresh');
                    $refreshIcon.addClass('spinning-icon');
                    $needsReload.hide();

                    const data = JSON.stringify({
                        snippet: input.message,
                        returnUrl: returnUrl
                    });

                    // Use jQuery post rather than the Utilities post here
                    // (don't want to navigate, just to do an AJAX call)
                    $.post(window.location.origin + '/compile/snippet', { data: data })
                        .then(processSnippetReload)
                        .fail(handleError)
                        .always(() => $refreshIcon.removeClass('spinning-icon'));
                });

                $needsReload.find('.action-dismiss').off('click').click(() => {
                    $needsReload.hide();
                    $('#heartbeat').remove();
                });

                $needsReload.show();
            });
    }

    function processSnippetReload() {
        console.log('TODO processing!');
    }
})();
