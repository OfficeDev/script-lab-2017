import * as $ from 'jquery';
import '../assets/styles/runner.scss';
declare var Firebug: any;

function loadFirebug(origin) {
    return new Promise<boolean>((resolve, reject) => {
        (window as any).origin = origin;
        const script = $(`<script type="text/javascript" src="${origin}/assets/firebug/firebug-lite-debug.js#startOpened"></script>`);
        script.appendTo('head');

        const interval = setInterval(() => {
            if ((window as any).firebugLiteIsLoaded) {
                clearInterval(interval);
                return resolve(true);
            }
        }, 250);
    });
}

const initializeRunner = async (origin: string, host: string, platform: string, officeJS: string) => {
    await loadFirebug(origin);

    let iframe = $('#snippet-container');
    let content = $('#iframe-code-content');
    let progress = $('#progress');
    let header = $('#header');

    let { contentWindow } = iframe[0] as HTMLIFrameElement;
    (contentWindow as any).console = window.console;
    contentWindow.onerror = (...args) => console.error(args);

    contentWindow.document.open();
    contentWindow.document.write(content.text());
    contentWindow.document.close();
    content.remove();

    if (officeJS) {
        contentWindow['Office'] = officeJS ? window['Office'] : {};
        ['OfficeExtension', 'Excel', 'Word', 'OneNote'].forEach(namespace => contentWindow[namespace] = window[namespace]);
    }

    iframe.show();
    progress.hide();
    header.show();
    Firebug.chrome.open();
};

(window as any).initializeRunner = initializeRunner;
