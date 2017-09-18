// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).

import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getGermanStrings(): ServerStrings {
    const playgroundName = 'Script Lab';
    const unexpectedError = 'Es ist ein unerwarteter Fehler aufgetreten.';

    return {
        playgroundName: playgroundName,
        playgroundTagline: 'Programmieren ● Ausführen ● Teilen',

        error: 'Fehler',
        unexpectedError: unexpectedError,
        invalidHost: 'Ungültiger Host',
        invalidId: 'Ungültige ID',
        receivedInvalidAuthCode: 'Ungültiger Authentifizerungscode.',
        failedToAuthenticateUser: 'Die Authentifizierung ist fehlgeschlagen.',
        receivedInvalidSnippetData: 'Fehler beim Empfang der Daten zum Schnipsel.',
        unrecognizedScriptLanguage: 'Unbekannte Script-Sprache.',
        line: 'Zeile',

        getLoadingSnippetSubtitle: (snippetName: string) => `Lade "${snippetName}"`,

        getSyntaxErrorsTitle: (count: number) => (count === 1 ? 'Syntaxfehler' : 'Syntaxfehler'),

        createdWithScriptLab: 'Erstellt mit Script Lab',

        scriptLabRunner: 'Script Lab Runner',
        versionInfo: 'Versionsinformationen',

        manifestDefaults: {
            nameIfEmpty: 'Schnipsel',
            descriptionIfEmpty: 'Erstellt mit Script Lab'
        },

        run: 'Ausführen',
        runPageTitle: 'Schnipsel ausführen',
        back: 'Zurück',
        snippetNotTrusted: getEnglishSubstitutesForNotYetTranslated().snippetNotTrusted,
        trust: getEnglishSubstitutesForNotYetTranslated().trust,
        cancel: getEnglishSubstitutesForNotYetTranslated().cancel,
        switchToSnippet: `Zu dem Schnipsel wechseln, welches Sie gerade editieren.`,
        snippetCodeChanged: 'Sie haben den Code zu diesem Schnipsel verändert. Aktualisieren Sie diese Seite, um die neue Version auszuführen.',
        refresh: 'Aktualisieren',
        dismiss: 'Abbrechen',
        editingDifferentSnippet1: `Sie editieren zurzeit ein anderes Schnipsel`,
        editingDifferentSnippet2: `Aktualisieren Sie diese Seite, um das Schnipsel auszuführen`,
        loadLatestSnippet: 'Das zuletzt verwendete Schnipsel laden.',

        RuntimeHelpers: {
            unexpectedError: unexpectedError,
            authenticationWasCancelledByTheUser: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.authenticationWasCancelledByTheUser,
            officeVersionDoesNotSupportAuthentication: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.officeVersionDoesNotSupportAuthentication
        }
    };
}
