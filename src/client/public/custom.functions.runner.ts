import * as $ from 'jquery';
import { UI } from '@microsoft/office-js-helpers';
import { environment } from '../app/helpers';
import { Strings } from '../app/strings';
import { officeNamespacesForIframe } from './runner.common';

interface InitializationParams {
    snippetsDataBase64: string;
    metadataBase64: string
}

interface RunnerCustomFunctionMetadata extends ICustomFunctionsSnippetRegistrationData {
    id: string;
}

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;"

(async () => {
    let params: InitializationParams = (window as any).customFunctionParams;

    try {
        environment.initializePartial({ host: 'EXCEL' });

        await initializeRunnableSnippets(params);

        await environment.createPlaygroundHostReadyTimer();
        window['Excel']['CustomFunctions']['initialize']();
    }
    catch (error) {
        handleError(error);
    }
})();

async function initializeRunnableSnippets(params: InitializationParams) {
    return new Promise(resolve => {
        let successfulRegistrationsCount = 0;

        const metadataArray: RunnerCustomFunctionMetadata[] = JSON.parse(atob(params.metadataBase64));

        (window as any).scriptRunnerBeginInit = (contentWindow: Window, options: { /* don't need them */ }) => {
            (contentWindow as any).console = window.console;
            contentWindow.onerror = (...args) => console.error(args);

            contentWindow['Office'] = window['Office'];
            officeNamespacesForIframe.forEach(namespace => {
                contentWindow[namespace] = window[namespace];
            });
        };

        (window as any).scriptRunnerEndInit = (iframeWindow: Window, id: string) => {
            const snippetMetadata = metadataArray.find(item => item.id === id);
            window[snippetMetadata.namespace] = {};
            snippetMetadata.functions.map(func => {
                console.log(`Mapped function ${func.name} from snippet ${id} on namespace ${snippetMetadata.namespace}`);

                // tslint:disable-next-line:only-arrow-functions
                window[snippetMetadata.namespace][func.name] = function () {
                    return iframeWindow[func.name].apply(null, arguments);
                };

                // In the meantime, until support namespaces, set the function directly on the window:
                window[func.name] = window[snippetMetadata.namespace][func.name];
            });

            successfulRegistrationsCount++;

            if (successfulRegistrationsCount === metadataArray.length) {
                resolve();
            }
        };

        const snippetsHtmls: string[] = JSON.parse(atob(params.snippetsDataBase64));

        snippetsHtmls.forEach(html => {
            let $iframe = $('<iframe class="snippet-frame" src="about:blank"></iframe>').appendTo('body');
            let iframe = $iframe[0] as HTMLIFrameElement;
            let { contentWindow } = iframe;

            // Write to the iframe (and note that must do the ".write" call first,
            // before setting any window properties). Setting console and onerror here
            // (for any initial logging or error handling from snippet-referenced libraries),
            // but for extra safety also setting them inside of scriptRunnerInitialized.
            contentWindow.document.open();
            contentWindow.document.write(html);
            (contentWindow as any).console = window.console;
            contentWindow.onerror = (...args) => {
                // TODO
                console.error(args);
            };
            contentWindow.document.close();
        });
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
