import { ServerStrings } from './index';

// Whenever there is no localized translation, use the English version.
// Whenever these two lines are not commented out, it means that there are
// still strings that need to be localized.
// Just search for "englishSubstitutesForNotYetTranslated" in this file
// import { getEnglishStrings } from './english';
// const englishSubstitutesForNotYetTranslated = getEnglishStrings();

export function getGermanStrings(): ServerStrings {
    return {
        error: 'Fehler',
        unexpectedError: 'Es ist ein unerwarteter Fehler aufgetreten.',
        invalidHost: 'Ungültiger Host',
        invalidId: 'Ungültige ID',
        receivedInvalidAuthCode: 'Ungültiger Authentifizerungscode.',
        failedToAuthenticateUser: 'Die Authentifizierung ist fehlgeschlagen.',
        receivedInvalidSnippetData: 'Fehler beim Empfang der Daten zum Schnipsel.',
        unrecognizedScriptLanguage: 'Unbekannte Script-Sprache.',
        line: 'Zeile',

        getLoadingSnippetSubtitle: (snippetName: string) => `Lade "${snippetName}"`,

        loadingSnippetDotDotDot: 'Schnipsel wird geladen ...',

        getSyntaxErrorsTitle: (count: number) => (count === 1 ? 'Syntaxfehler' : 'Syntaxfehler'),

        getGoBackToEditor: (editorUrl: string) =>
            `Willkommen bei Script Lab - möchten Sie lieber den Code-Editor statt des Fensters zur Ausführung sehen? Falls ja, klicken Sie hier ${editorUrl}, um zum Editor zu gelangen.`,

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
        switchToSnippet: `Zu dem Schnipsel wechseln, welches Sie gerade editieren.`,
        snippetCodeChanged: 'Sie haben den Code zu diesem Schnipsel verändert. Aktualisieren Sie diese Seite, um die neue Version auszuführen.',
        refresh: 'Aktualisieren',
        dismiss: 'Abbrechen',
        editingDifferentSnippet1: `Sie editieren zurzeit ein anderes Schnipsel`,
        editingDifferentSnippet2: `Aktualisieren Sie diese Seite, um das Schnipsel auszuführen`,
        loadLatestSnippet: 'Das zuletzt verwendete Schnipsel laden.'
    };
}
