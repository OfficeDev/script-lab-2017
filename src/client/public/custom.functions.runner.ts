// import * as $ from 'jquery';
import { UI } from '@microsoft/office-js-helpers';
import { environment } from '../app/helpers';
import { Strings } from '../app/strings';

interface InitializationParams {
    snippetsDataBase64: string;
}

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;"

(async () => {
    let params: InitializationParams = (window as any).customFunctionParams;

    try {
        environment.initializePartial({ host: 'EXCEL' });

        // Set initialize to an empty function -- that way, doesn't cause
        // re-initialization of this page in case of a page like the error dialog,
        // which doesn't defined (override) Office.initialize.
        Office.initialize = () => { };
        await initializeRunnableSnippets(params);
    }
    catch (error) {
        handleError(error);
    }
})();

async function initializeRunnableSnippets(params: InitializationParams) {
    const snippetsDataArray: ICustomFunctionsRunnerRelevantData[] = JSON.parse(atob(params.snippetsDataBase64));
    snippetsDataArray.forEach(item => {
        eval(item.script);
    });
}

function handleError(error: Error) {
    // TODO: think through how to bubble up errors
    let candidateErrorString = error.message || error.toString();
    if (candidateErrorString === '[object Object]') {
        candidateErrorString = Strings().unexpectedError;
    }

    if (error instanceof Error) {
        UI.notify(error);
    } else {
        UI.notify(Strings().error, candidateErrorString);
    }
}
