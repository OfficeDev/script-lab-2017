import * as $ from 'jquery';
import '../assets/styles/runner.scss';

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

interface IInitializeRunnerParams {
    origin: string;
    officeJS: string;
}

async function initializeRunner(params: IInitializeRunnerParams) {
    const { origin, officeJS } = params;

    const firebug = await loadFirebug(origin);

    const $iframe = $('#snippet-container');
    const iframe = $iframe[0] as HTMLIFrameElement;
    let { contentWindow } = iframe;
    let $snippetContent = $('#snippet-code-content');
    let $progress = $('#progress');
    let $header = $('#header');


    // Set up the functions that the snippet iframe will call

    (window as any).beginInitializingSnippet = () => {
        (contentWindow as any).console = window.console;
        if (officeJS) {
            contentWindow['Office'] = window['Office'] || {};
        }
    };

    (window as any).finishInitializingSnippet = () => {
        if (officeJS) {
            ['OfficeExtension', 'Excel', 'Word', 'OneNote'].forEach(
                namespace => contentWindow[namespace] = window[namespace]);
        }

        $iframe.show();
        $progress.hide();
        $header.show();
        if (firebug.chrome) {
            firebug.chrome.open();
        }
    };


    // And finally, write to the iframe:

    contentWindow.onerror = (...args) => console.error(args);

    contentWindow.document.open();
    contentWindow.document.write($snippetContent.text());
    contentWindow.document.close();

    $snippetContent.remove();
}

(window as any).initializeRunner = initializeRunner;
