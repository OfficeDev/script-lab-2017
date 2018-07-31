import * as $ from 'jquery';

/** Namespaces for the runner wrapper to share with the inner snippet iframe */
export const officeNamespacesForIframe = [
  'Office',
  'OfficeExtension',
  'OfficeCore',
  'OfficeRuntime',
  'Excel',
  'Word',
  'OneNote',
  'PowerPoint',
  'Visio',
  'ExcelOp',
];

/** Namespaces for the custom functions iframes to share with their overarching page.
 * Expose "OfficeExtension" and "Office" to the iframe, since those
 * might be used (e.g., for Promises).  But don't expose any further APIs.
 * (Note, this is still an evolving story)
 */
export const officeNamespacesForCustomFunctionsIframe = [
  'CustomFunctionMappings',
  'Office',
  'OfficeExtension',
  'OfficeRuntime',
];

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
