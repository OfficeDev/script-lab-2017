import * as $ from 'jquery';
import { UI } from '@microsoft/office-js-helpers';
import { environment } from '../app/helpers';
import { Strings, setDisplayLanguage } from '../app/strings';

interface InitializationParams {
    isAnySuccess: boolean;
    isAnyError: boolean;
    registerCustomFunctionsJsonStringBase64: string;
    explicitlySetDisplayLanguageOrNull: string;
}

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""

tryCatch(async () => {
    let params: InitializationParams = (window as any).customFunctionParams;

    environment.initializePartial({ host: 'EXCEL' });

    // Apply the host theming by adding this attribute on the "body" element:
    $('body').addClass('EXCEL');

    if (params.explicitlySetDisplayLanguageOrNull) {
        setDisplayLanguage(params.explicitlySetDisplayLanguageOrNull);
        document.cookie = `displayLanguage=${encodeURIComponent(params.explicitlySetDisplayLanguageOrNull)};path=/;`;
    }

    await new Promise((resolve) => {
        const interval = setInterval(() => {
            if ((window as any).playground_host_ready) {
                clearInterval(interval);
                return resolve();
            }
        }, 100);
    });

    checkIfCanRegister();

    $('#btn-continue').click(() => tryCatch(async () => await registerMetadata(params.registerCustomFunctionsJsonStringBase64)));
    $('#btn-dismiss').click(() => hideContinueContainer());

    if (params.isAnySuccess) {
        $('#continue-container').css('display', 'block');
    }

    if (!params.isAnyError) {
        await registerMetadata(params.registerCustomFunctionsJsonStringBase64);
    }
});


// Helpers

async function tryCatch(callback: () => void) {
    try {
        await callback();
    } catch (error) {
        $('#btn-continue').prop('disabled', true);
        handleError(error);
    }
}

function hideContinueContainer() {
    $('#continue-container').css('display', 'none');
}

async function registerMetadata(registerCustomFunctionsJsonStringBase64: string) {
    const registrationPayload = atob(registerCustomFunctionsJsonStringBase64);
    await Excel.run(async (context) => {
        (context.workbook as any).registerCustomFunctions('ScriptLab', registrationPayload);
        await context.sync();
    });
    window.location.href = `${environment.current.config.editorUrl}/custom-functions-dashboard.html`;
}

function checkIfCanRegister() {
    if (!(Office && Office.context && Office.context.requirements)) {
        throw new Error('Excel is not available.');
    } else if (!Office.context.requirements.isSetSupported('CustomFunctions', 1.1)) {
        throw new Error('Registering custom functions is not supported in this version of Excel.');
    }
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
