import { Utilities, HostType } from '@microsoft/office-js-helpers';
const { safeExternalUrls } = PLAYGROUND;

Office.initialize = () => {    const launchInDialog = (url: string, event?: any, options?: { width?: number, height?: number, displayInIframe?: boolean }) => {
        options = options || {};
        options.width = options.width || 60;
        options.height = options.height || 60;
        if (typeof options.displayInIframe === 'undefined') {
            options.displayInIframe = true;
        }
        Office.context.ui.displayDialogAsync(url, options, (result) => {
            if (Utilities.host === HostType.OUTLOOK) {
                if (result.status === Office.AsyncResultStatus.Failed) {
                    event.completed();
                }
                let dialog = result.value as Office.DialogHandler;
                dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
                    if (event) {
                        event.completed();
                    }
                });
            }
        });
        if (event && Utilities.host !== HostType.OUTLOOK) {
            event.completed();
        }
    };

    const launchDialogNavigation = (url: string, event: any, options?: { width?: number, height?: number, displayInIframe?: boolean }) => {
        launchInDialog(`${window.location.origin}/external-page.html?destination=${encodeURIComponent(url)}`, event, options);
    };

    (window as any).launchCode = (event) => launchInDialog(safeExternalUrls.code, event, { width: 75, height: 75, displayInIframe: false });

    (window as any).launchTutorial = (event) => launchInDialog(safeExternalUrls.tutorial, event, { width: 35, height: 45 });

    (window as any).launchHelp = (event) => launchDialogNavigation(safeExternalUrls.playground_help, event, { displayInIframe: false });

    (window as any).launchAsk = (event) => launchDialogNavigation(safeExternalUrls.ask, event, { displayInIframe: false });

    (window as any).launchApiDocs = (event) => {
        if (Office.context.requirements.isSetSupported('ExcelApi')) {
            return launchDialogNavigation(safeExternalUrls.excel_api, event);
        }
        else if (Office.context.requirements.isSetSupported('WordApi')) {
            return launchDialogNavigation(safeExternalUrls.word_api, event);
        }
        else if (Office.context.requirements.isSetSupported('OneNoteApi')) {
            return launchDialogNavigation(safeExternalUrls.onenote_api, event);
        }
        else {
            if (Utilities.host === HostType.POWERPOINT) {
                return launchDialogNavigation(safeExternalUrls.powepoint_api, event);
            }
            else if (Utilities.host === HostType.PROJECT) {
                return launchDialogNavigation(safeExternalUrls.project_api, event);
            }
            else if (Utilities.host === HostType.OUTLOOK) {
                return launchDialogNavigation(safeExternalUrls.outlook_api, event);
            }
            else {
                return launchDialogNavigation(safeExternalUrls.generic_api, event);
            }
        }
    };
};
