import { Utilities, HostType } from '@microsoft/office-js-helpers';

Office.initialize = () => {
    const urls = {
        //tutorial: `${window.location.origin}/assets/documents/script-lab-tutorial.xlsx`,
        tutorial: `${window.location.origin}/tutorial.html`,
        playground_help: 'https://github.com/OfficeDev/script-lab/blob/master/README.md',
        feedback: 'https://github.com/OfficeDev/script-lab/issues',
        ask: 'https://stackoverflow.com/questions/tagged/office-js',
        excel_api: 'https://dev.office.com/docs/add-ins/excel/excel-add-ins-javascript-programming-overview',
        word_api: 'https://dev.office.com/reference/add-ins/word/word-add-ins-reference-overview',
        onenote_api: 'https://dev.office.com/docs/add-ins/onenote/onenote-add-ins-programming-overview',
        powepoint_api: 'https://dev.office.com/docs/add-ins/powerpoint/powerpoint-add-ins',
        project_api: 'https://dev.office.com/reference/add-ins/shared/projectdocument.projectdocument',
        generic_api: 'https://dev.office.com/reference/add-ins/javascript-api-for-office'
    };

    const launchInDialog = (url: string, event?: any, options?: { width?: number, height?: number, displayInIframe?: boolean }) => {
        options = options || {};
        options.width = options.width || 60;
        options.height = options.height || 60;
        if (typeof options.displayInIframe === 'undefined') {
            options.displayInIframe = true;
        }

        Office.context.ui.displayDialogAsync(url, options, null);

        if (event) {
            event.completed();
        }
    };

    const launchDialogNavigation = (url: string, event: any, options?: { width?: number, height?: number, displayInIframe?: boolean }) => {
        launchInDialog(`${window.location.origin}/external-page.html?destination=${encodeURIComponent(url)}`, event, options);
    };

    (window as any).launchTutorial = (event) => launchInDialog(urls.tutorial, event, { width: 35, height: 45 });

    (window as any).launchHelp = (event) => launchInDialog(urls.playground_help, event);

    (window as any).launchFeedback = (event) => launchInDialog(urls.feedback, event);

    (window as any).launchAsk = (event) => launchDialogNavigation(urls.ask, event, { displayInIframe: false });

    (window as any).launchApiDocs = (event) => {
        if (Office.context.requirements.isSetSupported('ExcelApi')) {
            return launchDialogNavigation(urls.excel_api, event);
        }
        else if (Office.context.requirements.isSetSupported('WordApi')) {
            return launchDialogNavigation(urls.word_api, event);
        }
        else if (Office.context.requirements.isSetSupported('OneNoteApi')) {
            return launchDialogNavigation(urls.onenote_api, event);
        }
        else {
            if (Utilities.host === HostType.POWERPOINT) {
                return launchDialogNavigation(urls.powepoint_api, event);
            }
            else if (Utilities.host === HostType.PROJECT) {
                return launchDialogNavigation(urls.project_api, event);
            }
            else {
                return launchDialogNavigation(urls.generic_api, event);
            }
        }
    };
};
