import * as $ from 'jquery';
import { UI } from '@microsoft/office-js-helpers';
import { environment, instantiateRibbon } from '../app/helpers';
import { Strings, setDisplayLanguage } from '../app/strings';

interface InitializationParams {
    snippetsDataBase64: string;
    explicitlySetDisplayLanguageOrNull: string;
    returnUrl: string;
}

const CSS_CLASSES = {
    inProgress: 'in-progress',
    error: 'error',
    success: 'success'
};

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""

(async () => {
    let params: InitializationParams = (window as any).customFunctionParams;

    try {
        environment.initializePartial({ host: 'EXCEL' });


        // Apply the host theming by adding this attribute on the "body" element:
        $('body').addClass('EXCEL');
        $('#header').css('visibility', 'visible');

        if (instantiateRibbon('ribbon')) {
            $('#progress').css('border-top', '#ddd 5px solid;');
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
        await initializeRegistration(params);

    }
    catch (error) {
        handleError(error);
    }
})();

async function initializeRegistration(params: InitializationParams) {
    if (params.explicitlySetDisplayLanguageOrNull) {
        setDisplayLanguage(params.explicitlySetDisplayLanguageOrNull);
        document.cookie = `displayLanguage=${encodeURIComponent(params.explicitlySetDisplayLanguageOrNull)};path=/;`;
    }

    const snippetsDataArray: ICustomFunctionsRegistrationRelevantData[] = JSON.parse(atob(params.snippetsDataBase64));

    let customFunctionsMetadata: ICustomFunctionsRegistrationApiMetadata = validatesnippetsDataArray(snippetsDataArray);

    if (Office.context.requirements.isSetSupported('CustomFunctions', 1.1)) {
        await Excel.run(async (context) => {
            (context.workbook as any).registerCustomFunctions('ScriptLab', JSON.stringify(customFunctionsMetadata));
            await context.sync();
        });

        // const $pre = $('<pre></pre>');
        // $pre.text(JSON.stringify(customFunctionsMetadata, null, 4));
        // $('body').empty().append($pre);


        // TODO
        // if (showUI && !allSuccessful) {
        //     $('.ms-progress-component__footer').css('visibility', 'hidden');
        // }

        // if (isRunMode) {
        //     heartbeat.messenger.send<{ timestamp: number }>(heartbeat.window,
        //         CustomFunctionsMessageType.LOADED_AND_RUNNING, { timestamp: new Date().getTime() });
        // }
        // else {
        //     if (allSuccessful) {
        //         window.location.href = params.returnUrl;
        //     }
        // }
    } else {
        throw new Error('Registering custom functions is unsupported on this version of Excel.');
    }
}

function validatesnippetsDataArray(snippetsDataArray: ICustomFunctionsRegistrationRelevantData[]): ICustomFunctionsRegistrationApiMetadata {
    let customFunctionsMetadata: ICustomFunctionsRegistrationApiMetadata = {
        functions: []
    };

    // In the excel side the parser only cared for the required and optional parameters, any extra stuff is jsut ignored, as long as each function contains the required parameters it is okay any info they send
    // None the less, the validation of duplicate names does sound like a logic thing to be done here.

    const snippetDictionary: { [key: string]: boolean } = {};
    const $snippetNames = $('#snippet-names');

    snippetsDataArray.forEach((currentSnippet, snippetIndex) => {
        const functionDictionary: { [key: string]: boolean } = {};
        let $snippetEntry = $snippetNames.children().eq(snippetIndex);

        if (snippetDictionary[currentSnippet.data.namespace]) {
            $snippetEntry.find('.snippet-name').first().addClass(CSS_CLASSES.error);
            throw new Error(`The snippet namespace is already in use`);
        }
        snippetDictionary[currentSnippet.data.namespace] = true;
        $snippetEntry.find('.snippet-name').first().addClass(CSS_CLASSES.success);

        const $functionNames = $snippetEntry.find('.function-names').first();
        currentSnippet.data.functions.forEach((currentFunction, functionIndex) => {
            const parameterDictionary: { [key: string]: boolean } = {};
            let $functionEntry = $functionNames.children().eq(functionIndex);

            if (functionDictionary[currentFunction.name]) {
                $functionEntry.find('.function-name').first().addClass(CSS_CLASSES.error);
                throw new Error(`The function name is already in use`);
            }
            functionDictionary[currentFunction.name] = true;
            $functionEntry.find('.function-name').first().addClass(CSS_CLASSES.success);

            const $parameterNames = $functionEntry.find('.parameter-names').first();
            currentFunction.parameters.forEach((currentParameter, parameterIndex) => {
                let $parameterEntry = $parameterNames.children().eq(parameterIndex);
                if (parameterDictionary[currentParameter.name]) {
                    $parameterEntry.find('.parameter-name').first().addClass(CSS_CLASSES.error);
                    throw new Error(`The parameter name is already in use`);
                }
                parameterDictionary[currentParameter.name] = true;
                $parameterEntry.find('.parameter-name').first().addClass(CSS_CLASSES.success);
            });

            //The function is OKAY, append namespace to function name so that it can be the real custom function name
            currentFunction.name = `${currentSnippet.data.namespace}.${currentFunction.name}`;
            customFunctionsMetadata.functions.push(currentFunction);
        });
    });

    //     const snippetBase64OrNull = params.snippetIframesBase64Texts[i];
    //     let $entry = showUI ? $snippetNames.children().eq(i) : null;

    //     if (isNil(snippetBase64OrNull) || snippetBase64OrNull.length === 0) {
    //         if (showUI) {
    //             $entry.addClass(CSS_CLASSES.error);
    //         } else {
    //             heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
    //                 timestamp: new Date().getTime(),
    //                 source: 'system',
    //                 type: 'custom functions',
    //                 subtype: 'runner',
    //                 severity: 'error',
    //                 // TODO CUSTOM FUNCTIONS localization
    //                 message: `Could NOT load function "${params.snippetNames[i]}"`
    //             });
    //         }

    //         allSuccessful = false;
    //     }
    //     else {
    //         if (showUI) {
    //             $entry.addClass(CSS_CLASSES.inProgress);
    //         }

    //         let success = await runSnippetCode(atob(params.snippetIframesBase64Texts[i]));
    //         if (showUI) {
    //             $entry.removeClass(CSS_CLASSES.inProgress)
    //                 .addClass(success ? CSS_CLASSES.success : CSS_CLASSES.error);
    //         } else {
    //             if (success) {
    //                 heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
    //                     timestamp: new Date().getTime(),
    //                     source: 'system',
    //                     type: 'custom functions',
    //                     subtype: 'runner',
    //                     severity: 'info',
    //                     // TODO CUSTOM FUNCTIONS localization
    //                     message: `Sucessfully loaded "${params.snippetNames[i]}"`
    //                 });
    //             } else {
    //                 heartbeat.messenger.send<LogData>(heartbeat.window, CustomFunctionsMessageType.LOG, {
    //                     timestamp: new Date().getTime(),
    //                     source: 'system',
    //                     type: 'custom functions',
    //                     subtype: 'runner',
    //                     severity: 'error',
    //                     // TODO CUSTOM FUNCTIONS localization
    //                     message: `Could NOT load function "${params.snippetNames[i]}"`
    //                 });
    //             }
    //         }

    //         allSuccessful = allSuccessful && success;

    //     }

    return customFunctionsMetadata;
}


function handleError(error: Error) {

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
