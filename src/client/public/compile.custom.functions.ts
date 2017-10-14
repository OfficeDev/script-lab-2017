import * as $ from 'jquery';
import { isNil } from 'lodash';
import { UI } from '@microsoft/office-js-helpers';
import { environment, instantiateRibbon, generateUrl, navigateToCompileCustomFunctions, displayLogDialog } from '../app/helpers';
import { Strings, setDisplayLanguage } from '../app/strings';
import { officeNamespacesForIframe } from './runner.common';
import { Messenger, CustomFunctionsMessageType } from '../app/helpers/messenger';

interface InitializationParams {
    isRunMode: boolean;
    snippetNames: string[];
    snippetIframesBase64Texts: string[];
    heartbeatParams: ICustomFunctionsHeartbeatParams
    explicitlySetDisplayLanguageOrNull: string;
    returnUrl: string;
}

const CONSOLE_METHODS_TO_INTERCEPT = ['log', 'warn', 'error'];

const CSS_CLASSES = {
    inProgress: 'in-progress',
    error: 'error',
    success: 'success'
};

let heartbeat: {
    messenger: Messenger<CustomFunctionsMessageType>,
    window: Window
};

let isRunMode: boolean;
let showUI: boolean;
let allSuccessful = true;


// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""

(async () => {
    let params: InitializationParams = (window as any).customFunctionParams;

    try {
        environment.initializePartial({ host: 'EXCEL' });

        isRunMode = params.isRunMode;
        showUI = !isRunMode; /* show UI for registration, not when running in invisible pane */

        if (showUI) {
            // Apply the host theming by adding this attribute on the "body" element:
            $('body').addClass('EXCEL');
            $('#header').css('visibility', 'visible');

            if (instantiateRibbon('ribbon')) {
                $('#progress').css('border-top', '#ddd 5px solid;');
            }
        }

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if ((window as any).playground_host_ready) {
                    clearInterval(interval);
                    return resolve();
                }
            }, 100);
        });

        // Set initialize to an empty function -- that way, doesn't cause
        // re-initialization of this page in case of a page like the error dialog,
        // which doesn't defined (override) Office.initialize.
        Office.initialize = () => { };

        await initializeRunnerHelper(params);

    }
    catch (error) {
        handleError(error);
    }
})();

async function initializeRunnerHelper(params: InitializationParams) {
    // Establish heartbeat for all cases (even registration-mode runner, since will still need the heartbeat to communicate with log)
    await establishHeartbeat(params.heartbeatParams);

    if (params.explicitlySetDisplayLanguageOrNull) {
        setDisplayLanguage(params.explicitlySetDisplayLanguageOrNull);
        document.cookie = `displayLanguage=${encodeURIComponent(params.explicitlySetDisplayLanguageOrNull)};path=/;`;
    }

    const $snippetNames = showUI ? $('#snippet-names') : null;

    // Begin with clearing out the Excel.Script.CustomFunctions namespace
    // (which is assume to already exist and be initialized in the
    // "custom-functions" runtime helpers)
    (Excel as any).Script.CustomFunctions = {};

    const actualCount = params.snippetIframesBase64Texts.length - 1;
    /* Last one is always null, set in the template for ease of trailing commas... */

    for (let i = 0; i < actualCount; i++) {
        const snippetBase64OrNull = params.snippetIframesBase64Texts[i];
        let $entry = showUI ? $snippetNames.children().eq(i) : null;

        if (isNil(snippetBase64OrNull) || snippetBase64OrNull.length === 0) {
            if (showUI) {
                $entry.addClass(CSS_CLASSES.error);
            } else {
                heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
                    timestamp: new Date().getTime(),
                    source: 'system',
                    type: 'custom functions',
                    subtype: 'runner',
                    severity: 'error',
                    // TODO CUSTOM FUNCTIONS localization
                    message: `Could NOT load function "${params.snippetNames[i]}"`
                });
            }

            allSuccessful = false;
        }
        else {
            if (showUI) {
                $entry.addClass(CSS_CLASSES.inProgress);
            }

            let success = await runSnippetCode(atob(params.snippetIframesBase64Texts[i]));
            if (showUI) {
                $entry.removeClass(CSS_CLASSES.inProgress)
                    .addClass(success ? CSS_CLASSES.success : CSS_CLASSES.error);
            } else {
                if (success) {
                    heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
                        timestamp: new Date().getTime(),
                        source: 'system',
                        type: 'custom functions',
                        subtype: 'runner',
                        severity: 'info',
                        // TODO CUSTOM FUNCTIONS localization
                        message: `Sucessfully loaded "${params.snippetNames[i]}"`
                    });
                } else {
                    heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
                        timestamp: new Date().getTime(),
                        source: 'system',
                        type: 'custom functions',
                        subtype: 'runner',
                        severity: 'error',
                        // TODO CUSTOM FUNCTIONS localization
                        message: `Could NOT load function "${params.snippetNames[i]}"`
                    });
                }
            }

            allSuccessful = allSuccessful && success;

        }
    }

    // Complete any function registrations
    await Excel.run(async (context) => {
        (context.workbook as any).customFunctions.addAll();
        await context.sync();
    });

    if (showUI && !allSuccessful) {
        $('.ms-progress-component__footer').css('visibility', 'hidden');
    }

    if (isRunMode) {
        heartbeat.messenger.send<{ timestamp: number }>(heartbeat.window,
            CustomFunctionsMessageType.LOADED_AND_RUNNING, { timestamp: new Date().getTime() });
    }
    else {
        if (allSuccessful) {
            window.location.href = params.returnUrl;
        }
    }
}

/** Runs the snippet code and returns true if successful, or false if any errors were encountered */
function runSnippetCode(html: string): Promise<boolean> {
    const $iframe =
        $('<iframe class="snippet-frame" style="display:none" src="about:blank"></iframe>');
    $('body').append($iframe);

    const iframe = $iframe[0] as HTMLIFrameElement;
    let { contentWindow } = iframe;

    return new Promise((resolve, reject) => {
        (window as any).scriptRunnerBeginInit = () => {
            contentWindow['Office'] = window['Office'];
            officeNamespacesForIframe.forEach(namespace => {
                contentWindow[namespace] = window[namespace];
            });
            monkeyPatchConsole(contentWindow);
        };

        (window as any).scriptRunnerEndInit = () => {
            // Call Office.initialize(), which now initializes the snippet.
            // The parameter, initializationReason, is not used in the playground.
            Office.initialize(null /*initializationReason*/);
            resolve(true);
        };

        // Write to the iframe (and note that must do the ".write" call first,
        // before setting any window properties).
        contentWindow.document.open();
        contentWindow.document.write(html);
        contentWindow.onerror = (...args) => {
            logRuntimeMessageToConsole('error', args);
            resolve(false);
        };
        contentWindow.document.close();
    });


    function monkeyPatchConsole(windowToPatch: Window) {
        // Taken from http://tobyho.com/2012/07/27/taking-over-console-log/
        const console = windowToPatch.console;
        if (!console) {
            return;
        }

        const intercept = (methodName) => {
            const original = console[methodName];

            /* tslint:disable:only-arrow-functions */
            console[methodName] = function () {
                logRuntimeMessageToConsole(methodName, arguments);
                if (original.apply) {
                    // Do this for most browsers
                    original.apply(console, arguments);
                } else {
                    // Use a different method for IE
                    const message = Array.prototype.slice.apply(arguments).join(' ');
                    original(message);
                }
            };

            /* tslint:enable:only-arrow-functions */
        };

        CONSOLE_METHODS_TO_INTERCEPT.forEach(methodName => {
            intercept(methodName);
        });
    }

    function logRuntimeMessageToConsole(type: 'log' | 'warn' | 'error', data: any) {
        let severity: 'info' | 'warn' | 'error';
        if (type === 'log') {
            severity = 'info';
        } else {
            severity = type;
        }

        heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
            timestamp: new Date().getTime(),
            source: 'user',
            type: 'custom functions',
            subtype: 'user code',
            severity,
            message: data,
        });
    }
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
            heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
                timestamp: new Date().getTime(),
                source: 'system',
                type: 'custom functions',
                subtype: 'runner',
                severity: 'info',
                message: 'Request received for refreshing Custom Functions runner'
            });
            // Note, the above might realistically not get logged fast enough, before a refresh.  That's ok...

            navigateToCompileCustomFunctions('run', input.message);
        });

    heartbeat.messenger.listen<{}>()
        .filter(({ type }) => type === CustomFunctionsMessageType.SHOW_LOG_DIALOG)
        .subscribe(async input => displayLogDialog(environment.current.config.editorUrl));

    return new Promise(resolve => {
        heartbeat.messenger.listen<string>()
            .filter(({ type }) => type === CustomFunctionsMessageType.HEARTBEAT_READY)
            .subscribe(resolve);
    });
}

function handleError(error: Error) {
    allSuccessful = false;

    let candidateErrorString = error.message || error.toString();
    if (candidateErrorString === '[object Object]') {
        candidateErrorString = Strings().unexpectedError;
    }

    if (error instanceof Error) {
        UI.notify(error);
    } else {
        UI.notify(Strings().error, candidateErrorString);
    }

    heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
        timestamp: new Date().getTime(),
        source: 'system',
        type: 'custom functions',
        subtype: 'runner',
        severity: 'error',
        message: error
    });
}
