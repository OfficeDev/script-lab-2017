import * as $ from 'jquery';
import { UI } from '@microsoft/office-js-helpers';
import { environment, generateUrl, navigateToRunCustomFunctions } from '../app/helpers';
import { Strings } from '../app/strings';
import { officeNamespacesForIframe } from './runner.common';
import { Messenger, CustomFunctionsMessageType } from '../app/helpers/messenger';

interface InitializationParams {
    snippetsDataBase64: string;
    metadataBase64: string;
    heartbeatParams: ICustomFunctionsHeartbeatParams;
}

let heartbeat: {
    messenger: Messenger<CustomFunctionsMessageType>,
    window: Window
};

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

        heartbeat.messenger.send<{ timestamp: number }>(heartbeat.window,
            CustomFunctionsMessageType.LOADED_AND_RUNNING, { timestamp: new Date().getTime() });

    }
    catch (error) {
        handleError(error);
    }
})();

async function initializeRunnableSnippets(params: InitializationParams) {
    await establishHeartbeat(params.heartbeatParams);
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

                let splitIndex = func.name.lastIndexOf('.');
                let funcName = func.name.substr(splitIndex + 1);

                console.log(`Mapped function ${funcName} from snippet ${id} on namespace ${snippetMetadata.namespace}`);

                // tslint:disable-next-line:only-arrow-functions
                window[snippetMetadata.namespace][funcName] = function () {
                    return iframeWindow[funcName].apply(null, arguments);
                };

                // For older c++ versions that do not support namespace:
                window[funcName] = window[snippetMetadata.namespace][funcName];

                // Overwrite console.log on every snippet iframe
                iframeWindow['console']['log'] = consoleMsgTypeImplementation('info');
                iframeWindow['console']['warn'] = consoleMsgTypeImplementation('warn');
                iframeWindow['console']['error'] = consoleMsgTypeImplementation('error');

                function consoleMsgTypeImplementation(severityType) {
                    // tslint:disable-next-line:only-arrow-functions
                    return function (...args) {
                        let logMsg: string = '';
                        let isSuccessfulMsg: boolean = true;
                        args.forEach((element, index, array) => {
                            try {
                                logMsg += JSON.stringify(element) + ', ';
                            }
                            catch (e) {
                                isSuccessfulMsg = false;
                                logMsg += 'Error on console logging this argument ' + e.toString() + ', ';
                            }
                        });
                        if (logMsg.length > 0) {
                            logMsg = logMsg.slice(0, -2);
                        }
                        heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
                            timestamp: new Date().getTime(),
                            source: 'user',
                            type: 'custom functions',
                            subtype: 'runner',
                            severity: isSuccessfulMsg ? severityType : 'error',
                            message: logMsg
                        });
                    };
                }
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

function establishHeartbeat(heartbeatParams: ICustomFunctionsHeartbeatParams): Promise<any> {
    const $iframe = $('<iframe>', {
        src: generateUrl(`${environment.current.config.editorUrl}/custom-functions-heartbeat.html`, heartbeatParams),
        id: 'heartbeat'
    }).css('display', 'none').appendTo('body');

    heartbeat = {
        messenger: new Messenger(environment.current.config.editorUrl),
        window: ($iframe[0] as HTMLIFrameElement).contentWindow
    };

    heartbeat.messenger.listen<{}>()
        .filter(({ type }) => type === CustomFunctionsMessageType.NEED_TO_REFRESH)
        .subscribe(async input => {
            navigateToRunCustomFunctions(input.message);
        });

    return new Promise(resolve => {
        heartbeat.messenger.listen<string>()
            .filter(({ type }) => type === CustomFunctionsMessageType.HEARTBEAT_READY)
            .subscribe(resolve);
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
