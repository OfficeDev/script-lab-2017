import { environment } from '../app/helpers';

(($) => {
    function loadFirebug() {
        return new Promise<boolean>((resolve, reject) => {
            const script = $(`<script type="text/javascript" src="${environment.current.config.editorUrl}/assets/firebug/firebug-lite-debug.js#startOpened"></script>`);
            script.appendTo('head');

            const interval = setInterval(() => {
                if ((window as any).firebugLiteIsLoaded) {
                    clearInterval(interval);
                    return resolve(true);
                }
            }, 250);
        });
    }

    const initializeRunner = async (host, platform, officeJS: string) => {
        await environment.initialize(host, platform);
        await loadFirebug();

        let iframe = $('#snippet-container');
        let content = $('#iframe-content');
        let { contentWindow } = iframe[0] as HTMLIFrameElement;

        (contentWindow as any).console = window.console;
        if (officeJS) {
            contentWindow['Office'] = window['Office'] || {};
            contentWindow.onerror = (...args) => console.error(args);
            iframe.contents().find('html').html(content.text());
            content.remove();
        }

        (window as any).runnerReady = () => {
            (window as any).Firebug.chrome.open();
            if (officeJS) {
                ['OfficeExtension', 'Excel', 'Word', 'OneNote'].forEach(namespace => contentWindow[namespace] = window[namespace]);
            }
            iframe.show();
            $('#progress').hide();
        };
    };

    (window as any).initializeRunner = initializeRunner;
})(jQuery);
