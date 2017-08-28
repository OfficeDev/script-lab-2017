// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).

import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getSpanishStrings(): ServerStrings {
    const unexpectedError = 'Se produjo un error inesperado';

    return {
        error: 'Error',
        unexpectedError: unexpectedError,
        invalidHost: 'Host inválido',
        invalidId: 'ID inválido',
        receivedInvalidAuthCode: 'Se recibió un código de autenticación inválido',
        failedToAuthenticateUser: 'Falla al autenticar al usuario',
        receivedInvalidSnippetData: 'Se recibió un un fragmento de código inválido',
        unrecognizedScriptLanguage: 'Lenguaje de script no reconocido',
        line: 'Line',

        getLoadingSnippetSubtitle: (snippetName: string) => `Cargando "${snippetName}"`,

        loadingSnippetDotDotDot: 'Cargando código ...',

        getSyntaxErrorsTitle: (count: number) => (count === 1 ? 'Errores de sintaxis' : 'Syntax errors'),

        getGoBackToEditor: (editorUrl: string) =>
            `Bienvenido a Script Lab – pero probablemente quieres usar el Editor y no la ventana que ejecuta el código. Favor de regresar a ${editorUrl}`,

        createdWithScriptLab: 'Creado usando Script Lab',

        scriptLabRunner: 'Ejecutor Script Lab ',
        versionInfo: 'Información de versión',

        manifestDefaults: {
            nameIfEmpty: 'Framgmento de código',
            descriptionIfEmpty: 'Creado usando Script Lab'
        },

        run: 'Ejecutar',
        runPageTitle: 'Ejecutar código',
        back: 'Regresar',
        snippetNotTrusted: getEnglishSubstitutesForNotYetTranslated().snippetNotTrusted,
        trust: getEnglishSubstitutesForNotYetTranslated().trust,
        cancel: getEnglishSubstitutesForNotYetTranslated().cancel,
        switchToSnippet: `Regresar al código que estas editando.`,
        snippetCodeChanged: 'Cambiaste el código en este fragmento de código. Actualiza este panel para ejecutar la nueva versión.',
        refresh: 'Actualizar',
        dismiss: 'Ignorar',
        editingDifferentSnippet1: `Ahora estas editando un fragmento de código diferente.`,
        editingDifferentSnippet2: `Actualiza este panel para ejecutarlo`,
        loadLatestSnippet: 'Cargar el último fragmento de codigo',

        RuntimeHelpers: {
            unexpectedError: unexpectedError,
            authenticationWasCancelledByTheUser: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.authenticationWasCancelledByTheUser,
            officeVersionDoesNotSupportAuthentication: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.officeVersionDoesNotSupportAuthentication
        }
    };
}

