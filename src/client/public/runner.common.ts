import * as $ from 'jquery';

/** Namespaces for the runner wrapper to share with the inner snippet iframe */
export const officeNamespacesForIframe = ['OfficeExtension', 'OfficeCore', 'Excel', 'Word', 'OneNote', 'ExcelOp'];

export function loadFirebug(editorBaseUrl: string): Promise<void> {
    return new Promise<any>((resolve, reject) => {
        (window as any).firebugOriginUrl = editorBaseUrl;

        const firebugUrl = `${editorBaseUrl}/assets/firebug/firebug-lite-debug.js#startOpened`;
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
