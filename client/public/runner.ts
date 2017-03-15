import * as $ from 'jquery';
import { Messenger, MessageType } from '../app/helpers/messenger';
import '../assets/styles/extras.scss';

function loadFirebug(origin: string) {
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

function loadOfficeJS(url: string) {
    return new Promise<any>((resolve, reject) => {
        if (url == null || url.trim() === '') {
            return resolve(undefined);
        }

        const script = $(`<script type="text/javascript" src="${url}"></script>`);
        script.appendTo('head');
        let timeout;

        const interval = setInterval(() => {
            if ((window as any).Office) {
                clearInterval(interval);
                clearTimeout(timeout);
                return resolve((window as any).Office);
            }
        }, 250);

        timeout = setTimeout(() => {
            clearInterval(interval);
            clearTimeout(timeout);
            return reject(new Error('Failed to load Office.js'));
        }, 3000);
    });
}

async function initializeRunner(origin: string, officeJS: string) {
    const $subtitle = $('.ms-progress-component__sub-title');
    try {
        const officeLoadPromise = loadOfficeJS(officeJS);
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
        contentWindow.onerror = (...args) => console.error(args);
        contentWindow.document.open();
        contentWindow.document.write($snippetContent.text());
        contentWindow['Office'] = await officeLoadPromise;
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
        $subtitle.text(error.message || error.toString());
        $subtitle.css('color', '#ff6700');
    }
}

(window as any).initializeRunner = initializeRunner;
