import * as $ from 'jquery';
import { Messenger } from '../app/helpers/messenger';
import '../assets/styles/extras.scss';

(() => {
    async function initializeRunner(origin: string, officeJS: string) {
        createMessageListener();

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
        }
        catch (error) {
            handleError(error);
        }
    }

    (window as any).initializeRunner = initializeRunner;


    function handleError(error: Error) {
        $('.fullscreen').hide();
        $('#error').show();

        $('#error .subtitle').text(error.message || error.toString());
    }

    function loadFirebug(origin: string): Promise<void> {
        return new Promise<any>((resolve, reject) => {
            (window as any).origin = origin;
            const script = $(`<script type="text/javascript" src="${origin}/assets/firebug/firebug-lite-debug.js#startOpened"></script>`);
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

    function createMessageListener() {
        // TODO: Add heartbeat.  Leaving code as is for structure, for now

        const messenger = new Messenger(location.origin);
        messenger.listen()
            //.filter(({ type }) => type === MessageType.SNIPPET)
            .subscribe(message => {
                // TODO
            });
    }

})();
