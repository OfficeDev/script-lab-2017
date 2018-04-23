interface ClientStringsPerLanguage {
    playgroundName: string;
    playgroundTagline: string;

    // Environment names
    alpha: string,
    beta: string,
    production: string,
    staging: string,

    userId: string;

    run: string;
    runInThisPane: string;
    runSideBySide: string;
    share: string;
    delete: string;
    close: string;
    about: string;
    feedback: string;
    error: string;
    errors: string;
    dismiss: string;
    trustSnippetQuestionMark: string;

    ok: string;
    logout: string;
    logoutFromGraph: string;
    cancel: string;
    save: string;
    moreInfo: string;
    import: string;
    snippetImportExistingButtonLabel: string;
    overwriteExistingButtonLabel: string;
    createNewCopyButtonLabel: string;
    editorTriggerSuggestContextMenuLabel: string;

    failedToLoadCodeSnippet: string,

    snippetGistIdDuplicationError: string;
    snippetImportError: string;
    snippetImportErrorTitle: string;
    snippetImportErrorBody: string;
    cannotOpenSnippet: string;
    requestedSnippetNoLongerExists: string;
    reloadPrompt: string;

    cannotImportSnippetCreatedForDifferentHost: (snippetHost: string, currentHost: string) => string;
    currentHostDoesNotSupportRequiredApiSet: (currentHost: string, setName: string, setVersion: string) => string;

    snippetSaveError: string;
    snippetDupeError: string;
    snippetDeleteError: string;
    snippetDeleteAllError: string;
    snippetLoadAllError: string;
    snippetRunError: string;
    snippetLoadDefaultsError: string;
    snippetOpenInPlaygroundError: string;

    snippetNoOfficeTitle: string;
    snippetNoOfficeMessage: string;

    snippetUpdateError: string;

    snippetValidationEmpty: string;
    snippetValidationNoTitle: string;

    defaultSnippetTitle: string;
    newSnippetTitle: string;

    //ui.ts strings:
    dialogError: string;
    dialogOpenError: string;

    //monaco.ts strings:
    intellisenseUpdateError: string;
    intellisenseClearError: string;
    intellisenseLoadError: string;

    //github.ts strings:
    githubLoginFailed: string;
    githubLogoutFailed: string;
    profileCheckFailed: string;
    gistRetrieveFailed: string;
    gistDescriptionAppendage: string;

    gistShareFailedBody: string;
    gistShareFailedTitle: string;

    gistSharedDialogStart: string;
    gistSharedDialogEnd: string;
    gistSharedDialogTitle: string;
    gistSharedDialogViewButton: string;
    gistUpdateUrlIsSameAsBefore: string,
    gistUpdateSuccess: string,

    snippetCopiedConfirmation: string;
    snippetCopiedFailed: string;

    snippetExportFailed: string;
    snippetExportNotSupported: string;

    // Components strings
    // about.ts
    aboutStorage: string;
    aboutSnippets: string;
    aboutIntellisense: string;
    aboutCurrentEnvironment: string;
    aboutSwitchEnvironment: string;
    changeEnvironmentConfirm: string;
    showExperimentationFlags: string;
    invalidExperimentationFlags: string;

    //snippet.info.ts
    snippetInfoDialogTitle: string;
    nameLabel: string;
    descriptionLabel: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    gistUrlLabel: string;
    gistUrlLinkLabel: string;

    // Containers strings
    //app.ts

    shareMenuPublic: string;
    shareMenuPrivate: string;
    updateMenu: string;
    sharePublicSnippetConfirm: string;
    sharePrivateSnippetConfirm: string;

    shareMenuClipboard: string;
    shareMenuExport: string;

    loginGithub: string;

    lightTheme: string;
    darkTheme: string;

    deleteSnippetConfirm: string;

    tabDisplayNames: {
        'script': string;
        'template': string;
        'style': string;
        'libraries': string;
        'customFunctions': string;
    };

    registerCustomFunctions: string;
    getTextForCustomFunctionsLastUpdated: (lastUpdatesXSecondsAgo: string, lastAliveXSecondsAgo: string) => string;

    // view.mode.ts strings

    openInPlayground: string;
    openInHost: string;
    openInGithub: string;
    downloadAsHostFile: string;
    openTryIt: string;

    // Gallery.view strings

    snippetsTab: string;
    samplesTab: string;

    noSnippetsMessage: string;
    noGistsMessage: string;

    newSnippetDescription: string;
    importDescription: string;

    // Outlook-only strings

    noRunInOutlook: string;

    // import.ts strings

    newSnippetLabel: string;
    mySnippetsLabel: string;
    samplesLabel: string;
    importLabel: string;
    mySnippetsDescription: string;
    localSnippetsLabel: string;
    noLocalSnippets: string;
    sharedGistsLabel: string;
    sharedGistsSignIn: string;
    samplesDescription: string;
    noSamplesMessage: string;
    importWarning: string;
    importWarningAction: string;
    importSucceed: string;

    localStorageWarning: string;
    localStorageWarningAction: string;

    importInstructions: string;
    importUrlOrYamlLabel: string;
    exampleAbbreviation: string;

    pleaseWait: string;
    scriptLabIsReloading: string;
    unexpectedError: string;

    snippetNotTrusted: string;
    trust: string;

    Refresh: {
        /** Error if refresh URL is somehow misformed (should essentially never happen) */
        missingSnippetParameters: string;

        /** Appends one of the following -- "returning" or "close this window and try again" -- to the error message
         * (navigating back after a couple of seconds, if there is a return URL) */
        getTextToAppendToErrorMessage: (returnUrl: string) => string;
    };

    Runner: {
        snippetNoLongerExists: string;

        reloadingOfficeJs: string;

        noSnippetIsCurrentlyOpened: string;

        getLoadingSnippetSubtitle(snippetName?: string): string;

        runtimeErrorWhileLoadingTheSnippet: string;
        goBackToEditorToFixError: string;
    };

    /** Error strings served by the server and displayed in the Error page */
    ServerError: {
        moreDetails: string;
        hideDetails: string;
    };

    SideBySideInstructions: {
        title: string;

        /** Message about where to find the "run" button in the ribbon, and why side-by-side is better */
        message: string;

        gotIt: string;
    };

    HtmlPageStrings: {
        PageTitles: {
            code: string;
            run: string;
            tutorial: string;
        }

        chooseYourHost: string;
        localStorageUnavailableMessage: string;

        loadingRunnerDotDotDot: string;
        running: string;
        lastOpenedSnippet: string;
        noLastOpenedSnippets: string;
        toGetStartedCreateOrImportSnippet: string;
        mySavedSnippets: string;
        noLocalSnippets: string;
        lastUpdated: string;
        clickToRefresh: string;

        tutorialDescription: string;
        download: string;
        errorInitializingScriptLab: string;
    };

    Auth: {
        authenticatingOnBehalfOfSnippet: string;
        loggingOutOnBehalfOfSnippet: string;
        authenticationRedirect: string;
        authenticationError: string;
        unrecognizedResource: string;
        invalidParametersPassedInForAuth: string;
        invalidAuthResponseReceived: string;
        yourAccessTokenIs: string;
    }
}

interface ClientStrings extends ClientStringsPerLanguage {
    importUrlPlaceholder: string;
}
