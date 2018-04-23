// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).

import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getGermanStrings(): ClientStringsPerLanguage {
    // NOTE: Be sure to modify in both client and server code when
    //  adding/changing the shared strings!
    const sharedBetweenServerAndClient = {
        playgroundName: 'Script Lab',
        playgroundTagline: 'Programmieren ● Ausführen ● Teilen',

        unexpectedError: 'Es ist ein unerwarteter Fehler aufgetreten.',

        snippetNotTrusted: 'Dieses Schnipsel stammt aus einer externen Quelle. Sie müssen dem Schnipsel vertrauen, bevor Sie dieses ausführen können.',
        trust: 'Vertrauen',

        error: 'Fehler',
        cancel: 'Abbrechen',
        dismiss: 'Schließen',
    };

    const { playgroundName } = sharedBetweenServerAndClient;

    return {
        alpha: 'Alpha',
        beta: 'Beta',
        production: 'Produktiv',
        staging: getEnglishSubstitutesForNotYetTranslated().staging,

        userId: 'Benutzer-ID',

        run: 'Ausführen',
        runInThisPane: 'Hier ausführen',
        runSideBySide: 'Separat ausführen',
        share: 'Teilen',
        delete: 'Löschen',
        close: 'Schließen',
        about: 'Info',
        feedback: 'Feedback',
        errors: 'Fehler',
        trustSnippetQuestionMark: getEnglishSubstitutesForNotYetTranslated().trustSnippetQuestionMark,

        ok: 'OK',
        logout: 'Abmelden',
        logoutFromGraph: getEnglishSubstitutesForNotYetTranslated().logoutFromGraph,
        save: 'Speichern',
        moreInfo: 'Mehr Infos',
        import: 'Importieren',
        snippetImportExistingButtonLabel: 'Zum bestehenden Schnipsel wechseln',
        overwriteExistingButtonLabel: 'Bestehendes Schnipsel überschreiben',
        createNewCopyButtonLabel: 'Eine neue Kopie erstellen',
        editorTriggerSuggestContextMenuLabel: 'Trigger-Vorschlag',

        failedToLoadCodeSnippet: 'Das Laden des Code-Schnipsels ist fehlgeschlagen.',

        snippetGistIdDuplicationError: 'Es existiert bereits ein Schnipsel, das aus dem gleichen GitHub-Gist importiert wurde. Möchten Sie zu diesem Schnipsel wechseln oder eine neue Kopie erstellen?',
        snippetImportError: 'Der Import des Schnipsels ist fehlgeschlagen.',
        snippetImportErrorTitle: 'Importfehler',
        snippetImportErrorBody: `Wir konnten das Schnipsel nicht importieren.`,
        cannotOpenSnippet: 'Das Schnipsel konnte nicht geöffnet werden',
        requestedSnippetNoLongerExists: 'Das angeforderte Schnipsel existiert nicht mehr.',
        reloadPrompt: 'Laden Sie diesen Aufgabenbereich erneut und probieren Sie anschließend eine andere URL oder ID aus.',

        cannotImportSnippetCreatedForDifferentHost:
            (snippetHost: string, currentHost: string) =>
                `Ein für ${snippetHost} erstelltes Code-Schnipsel kann nicht in ${currentHost} importiert werden.`,
        currentHostDoesNotSupportRequiredApiSet:
            (currentHost: string, setName: string, setVersion: string) =>
                `${currentHost} unterstützt nicht die erforderliche API-Version ${setName} @ ${setVersion}`,

        snippetSaveError: 'Das aktuelle Schnipsel konnte nicht gespeichert werden.',
        snippetDupeError: 'Das aktuelle Schnipsel konnte nicht dupliziert werden.',
        snippetDeleteError: 'Das aktuelle Schnipsel konnte nicht gelöscht werden.',
        snippetDeleteAllError: 'Die lokal gespeicherten Schnipsel konnten nicht gelöscht werden.',
        snippetLoadAllError: 'Die lokal gespeicherten Schnipsel konnten nicht geladen werden.',
        snippetRunError: 'Die Ausführung des Schnipsels ist fehlgeschlagen.',
        snippetLoadDefaultsError: 'Die Beispiel-Schnipsel konnten nicht geladen werden.',
        snippetOpenInPlaygroundError: /** Note: this is a more general translation **/ 'Das Schnipsel konnte nicht geöffnet werden',

        snippetNoOfficeTitle: 'Dieses Schnipsel kann nicht ausgeführt werden.',
        snippetNoOfficeMessage: 'Office Code-Schnipsel können nur innerhalb eines Office-Add-Ins ausgeführt werden. Erweitern Sie Office heute noch um das kostenlose Add-In Script Lab, welches Sie unter https://aka.ms/getscriptlab abrufen können.',

        snippetUpdateError: 'Das Schnipsel konnte nicht aktualisiert werden.',

        snippetValidationEmpty: `Ihr Schnipsel darf nicht leer sein.`,
        snippetValidationNoTitle: 'Ihr Schnipsel benötigt einen Namen.',

        defaultSnippetTitle: 'Neues Schnipsel',
        newSnippetTitle: 'Leeres Schnipsel' /* string gets modified at runtime */,

        //ui.ts strings:
        dialogError: 'In dem Dialog ist ein Fehler aufgetreten.',
        dialogOpenError: 'Ein weiterer Dialog ist bereits geöffnet.',

        //monaco.ts strings:
        intellisenseUpdateError: 'IntelliSense konnte nicht aktualisiert werden.',
        intellisenseClearError: 'IntelliSense konnte nicht zurückgesetzt werden.',
        intellisenseLoadError: 'Die IntelliSense-Datei konnte nicht geladen werden.',

        //github.ts strings:
        githubLoginFailed: 'Die Anmeldung bei GitHub ist fehlgeschlagen.',
        githubLogoutFailed: 'Die Abmeldung bei GitHub ist fehlgeschlagen.',
        profileCheckFailed: 'Das GitHub-Profil konnte nicht abgerufen werden.',
        gistRetrieveFailed: 'Die GitHub-Gists konnten nicht abgerufen werden.',
        gistDescriptionAppendage: `Geteilt mit ${playgroundName}.`,

        gistShareFailedBody: 'Das Teilen des GitHub-Gists ist fehlgeschlagen.',
        gistShareFailedTitle: 'Das Teilen ist fehlgeschlagen',

        gistSharedDialogStart: 'Die URL von Ihrem GitHub-Gist ist:',
        gistSharedDialogEnd: `Klicken Sie auf den Befehl ${playgroundName}, um Ihr Schnipsel zu importieren und geben Sie folgende URL an.`,
        gistSharedDialogTitle: 'Teilen Sie Ihr Schnipsel',
        gistSharedDialogViewButton: 'Bei GitHub ansehen',
        gistUpdateUrlIsSameAsBefore: 'Die URL Ihres aktualisierten GitHub-Gists ist dieselbe wie zuvor:',
        gistUpdateSuccess: 'Das Schnipsel wurde erfolgreich aktualisiert.',

        snippetCopiedConfirmation: `Das Schnipsel wurde in die Zwischenablage kopiert`,
        snippetCopiedFailed: 'Das Schnipsel konnte nicht in die Zwischenablage kopiert werden.',

        snippetExportFailed: 'Das Schnipsel konnte nicht exportiert werden.',
        snippetExportNotSupported: 'Das Exportieren von Schnipseln wird in dieser Office-Version noch nicht unterstützt. Unterstützte Plattformen sind zurzeit Windows und Office-Online.',

        // Components strings
        // about.ts
        // Syntax of {0}, {1}... is used for placeholders and should not be localized
        aboutStorage: 'Speicher:',
        aboutSnippets: 'Lokale Schnipsel',
        aboutIntellisense: 'IntelliSense',
        aboutCurrentEnvironment: 'Aktuelle Umgebung:',
        aboutSwitchEnvironment: 'Wechseln von {0} zu {1}',
        changeEnvironmentConfirm: 'Sie sind dabei, zu einer anderen Umgebung von Script Lab zu wechseln und verlieren dadurch den Zugriff auf Ihre gespeicherten Schnipsel bis Sie wieder zu dieser Umgebung zurückkehren. Möchten Sie fortfahren?',
        showExperimentationFlags: 'Experimentelle Flags anzeigen',
        invalidExperimentationFlags: 'Bei den experimentellen Flags muss es sich um Daten in einem gültigen JSON-Format handeln.',

        //snippet.info.ts
        snippetInfoDialogTitle: 'Schnipsel-Info',
        nameLabel: 'Name',
        descriptionLabel: 'Beschreibung',
        namePlaceholder: 'Name des Schipsels',
        descriptionPlaceholder: 'Beschreibung des Schipsels',
        gistUrlLabel: 'GitHub-Gist-URL',
        gistUrlLinkLabel: 'Im Browser öffnen',

        // Containers strings
        //app.ts

        shareMenuPublic: 'Neues öffentliches GitHub-Gist',
        shareMenuPrivate: 'Neues geheimes GitHub-Gist',
        updateMenu: 'Bestehendes GitHub-Gist aktualisieren',
        sharePublicSnippetConfirm: 'Sind Sie sicher, dass dieses Schnipsel erneut in einem neuen öffentlichen GitHub-Gist geteilt werden soll?',
        sharePrivateSnippetConfirm: 'Sind Sie sicher, dass dieses Schnipsel erneut in einem neuen geheimen GitHub-Gist geteilt werden soll?',

        shareMenuClipboard: 'In die Zwischenablage kopieren',
        shareMenuExport: 'Zur Veröffentlichung exportieren',

        loginGithub: 'Bei GitHub anmelden',

        lightTheme: 'Hell',
        darkTheme: 'Dunkel',

        deleteSnippetConfirm: 'Sind Sie sicher, dass dieses Schnipsel gelöscht werden soll?',

        tabDisplayNames: {
            'script': 'Script',
            'template': 'HTML',
            'style': 'CSS',
            'libraries': 'Bibliotheken',
            'customFunctions': getEnglishSubstitutesForNotYetTranslated().tabDisplayNames.customFunctions
        },

        registerCustomFunctions: getEnglishSubstitutesForNotYetTranslated().registerCustomFunctions,
        getTextForCustomFunctionsLastUpdated: getEnglishSubstitutesForNotYetTranslated().getTextForCustomFunctionsLastUpdated,

        // Gallery.view strings

        snippetsTab: 'Schnipsel',
        samplesTab: 'Beispiele',

        noSnippetsMessage: 'Es wurden auf diesem Computer noch keine Schnipsel gespeichert. Sie können ein neues Schnipsel erstellen, ein Schnipsel aus den Beispielen auswählen oder ein Schnipsel importieren.',
        noGistsMessage: `Es wurde noch kein Schnipsel in einem GitHub-Gist abgelegt. Nach dem Erstellen oder Ändern eines Schnipsels lässt sich dieses anhand der Teilen-Funktion hochladen.`,

        newSnippetDescription: 'Neues Schnipsel erstellen',
        importDescription: 'Schnipsel aus einem GitHub-Gist abrufen oder anhand von YAML-Code erstellen.',

        // view.mode.ts strings

        openInPlayground: 'In Script Lab öffnen',
        openInHost: 'In {0} öffnen',
        openInGithub: 'In GitHub öffnen',
        downloadAsHostFile: '{0} Datei herunterladen',
        openTryIt: 'In Ihrem Browser ausprobieren',

        // Outlook-only strings

        noRunInOutlook: 'Das Code-Schnipsel kann in Outlook nicht aus dem Code-Fenster heraus ausgeführt werden. Bitte öffnen Sie den Aufgabenbereich zur Code-Ausführung und rufen Sie das Schnipsel von dort aus auf.',

        // import.ts strings

        newSnippetLabel: 'Neues Schnipsel',
        mySnippetsLabel: 'Meine Schnipsel',
        samplesLabel: 'Beispiele',
        importLabel: 'Schnipsel importieren',
        mySnippetsDescription: 'Wählen Sie ein gespeichertes Schnipsel aus.',
        localSnippetsLabel: 'Meine Schnipsel auf diesem Computer',
        noLocalSnippets: `Sie haben auf diesem Computer noch keine Schnipsel gespeichert. Erstellen Sie ein neues Schnipsel oder importieren Sie eines, um zu starten.`,
        sharedGistsLabel: 'Meine in GitHub-Gists gespeicherten Schnipsel',
        sharedGistsSignIn: 'Melden Sie sich bei GitHub an, um eines Ihrer in dortigen Gists abgelegten Schnipsel abzurufen.',
        samplesDescription: 'Wählen Sie eines der nachfolgenden Beispiele aus, um zu starten.',
        noSamplesMessage: `Es sind noch keine Beispiel-Schnipsel für diese Host-Anwendung verfügbar.`,
        importWarning: `Importierte Schnipsel können schädlichen Code enthalten. Führen Sie nur Schnipsel aus, deren Quelle Sie vertrauen.`,
        importWarningAction: `Diese Meldung nicht mehr anzeigen.`,
        importSucceed: 'Das Schnipsel wurde erfolgreich importiert',

        localStorageWarning: `Alle lokal gespeicherten Schnipsel werden gelöscht, wenn Sie Ihren Browser-Cache löschen. ` +
            `Um Ihre Schnipsel dauerhaft zu speichern, legen Sie diese anhand der Teilen-Funktion in GitHub-Gists ab.`,
        localStorageWarningAction: `Diese Meldung nicht mehr anzeigen.`,

        importInstructions: `Geben Sie die URL zum Schnipsel an oder fügen Sie den YAML-Code in das entsprechende Feld ein. Klicken Sie anschließend auf`,
        importUrlOrYamlLabel: 'URL des Schnipsels oder YAML-Code'
            /* String has been tweaked from original.  It should now be roughly a shortened combination of
               "URL oder GitHub-Gist-ID zum Code-Schnipsel"
               and
               "YAML-Code des Schnipsels"
            */,
        exampleAbbreviation: `z.B.`,

        unexpectedError: 'Es ist ein unerwarteter Fehler aufgetreten.',
        pleaseWait: 'Bitte warten',
        scriptLabIsReloading: 'Script Lab wird neu geladen',

        Refresh: {
            /** Error if refresh URL is somehow misformed (should essentially never happen) */
            missingSnippetParameters: `Ein Konfigurationsproblem hat das Laden des Schnipsels verhindert.`,

            /** Appends one of the following to the error message
             * (navigating back after a couple of seconds, if there is a return URL) */
            getTextToAppendToErrorMessage: (returnUrl: string) =>
                returnUrl ? 'Zurück zu ...' : 'Schließen Sie dieses Fenster und versuchen Sie es nochmal.'
        },

        Runner: {
            snippetNoLongerExists: 'Das Schnipsel ist nicht mehr verfügbar. Laden Sie diese Seite neu oder kehren Sie zu der vorherigen Seite zurück.',

            reloadingOfficeJs: 'Office.js wird neu geladen.',

            noSnippetIsCurrentlyOpened: `Im Code-Fenster ist kein geöffnetes Schnipsel vorhanden.`,

            getLoadingSnippetSubtitle: (snippetName?: string) => {
                return 'Lade ' + (snippetName ? `"${snippetName}"` : 'Schnipsel');
            },

            runtimeErrorWhileLoadingTheSnippet: 'Beim Laden des Schnipsels ist ein Laufzeitfehler aufgetreten',
            goBackToEditorToFixError: 'Wechseln Sie bitte zum Editor, um den Fehler zu beheben.',
        },

        /** Error strings served by the server and displayed in the Error page */
        ServerError: {
            moreDetails: 'Mehr Details...',
            hideDetails: 'Weniger Details...'
        },

        SideBySideInstructions: {
            title: 'Separat ausführen',

            message: [
                'Wählen Sie im Menüband den Befehl "Ausführen", um das Schnipsel in einem eigenen Fenster auszuführen.',
                '',
                'Diese Art der Ausführung bewirkt eine schnellere Aktualisierung Ihres Schnipsels und bietet Ihnen zudem die Möglichkeit, Ihre aktuelle Position im Quelltext sowie den Bearbeitungsverlauf beizubehalten.'
            ].join('\n'),

            gotIt: 'Verstanden'
        },

        HtmlPageStrings: {
            PageTitles: {
                code: 'Code',
                run: 'Ausführen',
                tutorial: 'Tutorial'
            },

            chooseYourHost: 'Wählen Sie Ihre Host-Anwendung:',

            localStorageUnavailableMessage:
                'Script Lab kann nicht initialisiert werden, da der lokale Speicher des verwendeten Browsers deaktiviert wurde. ' +
                'Verwenden Sie eine anderen Browser bzw. Computer oder überprüfen Sie Ihre Interneteinstellungen.',

            loadingRunnerDotDotDot: 'Wird geladen...',
            running: 'Ausführung',
            lastOpenedSnippet: 'Zuletzt verwendetes Schnipsel',
            noLastOpenedSnippets: 'Sie verfügen über kein zuletzt geladenes Schnipsel.',
            toGetStartedCreateOrImportSnippet: 'Wählen Sie im Menüband den Befehl "Code", um ein Schnipsel zu erstellen oder zu importieren.',
            mySavedSnippets: 'Meine gespeicherten Schnipsel',
            noLocalSnippets: 'Es wurden auf diesem Computer noch keine Schnipsel gespeichert.',
            lastUpdated: 'Letztes Update',
            clickToRefresh: 'Zum Aktualisieren hier klicken',

            tutorialDescription: 'Folgende Excel-Datei beinhaltet eine Anleitung, um Script Lab in',
            download: 'wenigen Schritten kennenzulernen:',
            errorInitializingScriptLab: 'Es ist ein Fehler bei der Initialisierung von Script Lab aufgetreten.'
        },

        Auth: {
            authenticatingOnBehalfOfSnippet: 'Authentifizierung durch das Schnipsel...',
            loggingOutOnBehalfOfSnippet: 'Abmeldung durch das Schnipsel...',
            authenticationRedirect: 'Umleitung zur Authentifizierung',
            authenticationError: 'Authentifizierungsfehler',
            unrecognizedResource: 'Unerkannte Ressource',
            invalidParametersPassedInForAuth: 'Es wurden ungültige Parameter zur Authentifizierung übergeben',
            invalidAuthResponseReceived: 'Der Authentifizierungsdienst hat eine ungültige Antwort zurückgeliefert',
            yourAccessTokenIs: 'Ihr Zugangstoken ist'
        },

        ...sharedBetweenServerAndClient
    };
}
