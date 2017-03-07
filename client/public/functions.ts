import { Utilities, HostType } from '@microsoft/office-js-helpers';

Office.initialize = () => { };

const urls = {
    tutorial: 'https://github.com/OfficeDev/addin-playground',
    playground_help: 'https://github.com/OfficeDev/addin-playground',
    feedback: 'https://github.com/OfficeDev/addin-playground/issues',
    ask: 'http://stackoverflow.com/questions/tagged/office-js',
    excel_api: 'https://dev.office.com/docs/add-ins/excel/excel-add-ins-javascript-programming-overview',
    word_api: 'https://dev.office.com/reference/add-ins/word/word-add-ins-reference-overview',
    onenote_api: 'https://dev.office.com/docs/add-ins/onenote/onenote-add-ins-programming-overview',
    powepoint_api: 'https://dev.office.com/docs/add-ins/powerpoint/powerpoint-add-ins',
    project_api: 'https://dev.office.com/reference/add-ins/shared/projectdocument.projectdocument',
    generic_api: 'https://dev.office.com/reference/add-ins/javascript-api-for-office'
};

const launch = (url: string, event?: any) => {
    window.open(url);
    if (event) {
        event.completed();
    }
};

/* TODO: remap to tutorial, once have it */
(window as any).launchTutorial = (event) => launch(urls.tutorial, event);

/* TODO: remap to help topic, once have it */
(window as any).launchUsingHelp = (event) => launch(urls.playground_help, event);

(window as any).launchFeedback = (event) => launch(urls.feedback, event);

(window as any).launchAsk = (event) => launch(urls.ask, event);

(window as any).launchApiDocs = (event) => {
    if (Office.context.requirements.isSetSupported('ExcelApi')) {
        return launch(urls.excel_api, event);
    }
    else if (Office.context.requirements.isSetSupported('WordApi')) {
        return launch(urls.word_api, event);
    }
    else if (Office.context.requirements.isSetSupported('OneNoteApi')) {
        return launch(urls.onenote_api, event);
    }
    else {
        if (Utilities.host === HostType.POWERPOINT) {
            return launch(urls.powepoint_api, event);
        }
        else if (Utilities.host === HostType.PROJECT) {
            return launch(urls.project_api, event);
        }
        else {
            return launch(urls.generic_api, event);
        }
    }
};
