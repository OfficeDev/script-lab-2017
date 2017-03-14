import * as $ from 'jquery';
import { Messenger, MessageType } from '../app/helpers/messenger';
import '../assets/styles/extras.scss';

function loadFirebug(origin) {
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

async function initializeRunner(origin: string) {
    try {
        const $iframe = $('#snippet-container');
        const $snippetContent = $('#snippet-code-content');
        const $progress = $('#progress');
        const $header = $('#header');
        const firebug = await loadFirebug(origin);
        const iframe = $iframe[0] as HTMLIFrameElement;
        const messenger = new Messenger(location.origin);
        let { contentWindow } = iframe;

        // Set up the functions that the snippet iframe will call
        (contentWindow as any).console = window.console;
        contentWindow['Office'] = window['Office'] || undefined;
        contentWindow.onerror = (...args) => console.error(args);
        contentWindow.document.open();
        contentWindow.document.write($snippetContent.text());
        contentWindow.document.close();
        $snippetContent.remove();

        // Listen to a snippet ready message from the inner frame
        let subscription = messenger.listen()
            .filter(({ type }) => type === MessageType.SNIPPET)
            .subscribe(message => {
                ['OfficeExtension', 'Excel', 'Word', 'OneNote'].forEach(namespace => contentWindow[namespace] = window[namespace] || undefined);
                $iframe.show();
                $progress.hide();
                $header.show();
                if (firebug.chrome) {
                    firebug.chrome.open();
                }
                if (subscription && !subscription.closed) {
                    subscription.unsubscribe();
                }
            });
    }
    catch (error) {
        console.error(error);
    }
}

(window as any).initializeRunner = initializeRunner;
