interface ServerStrings {
    /** Note: playground name and tagline can be copied from client strings */
    playgroundName: string;
    playgroundTagline: string;

    error: string;
    unexpectedError: string;
    invalidHost: string;
    invalidId: string;
    receivedInvalidAuthCode: string;
    failedToAuthenticateUser: string;
    receivedInvalidSnippetData: string;
    unrecognizedScriptLanguage: string;
    line: string;

    getLoadingSnippetSubtitle(snippetName: string): string;
    getSyntaxErrorsTitle(count: number): string

    createdWithScriptLab: string;

    scriptLabRunner: string;
    versionInfo: string;

    manifestDefaults: {
        nameIfEmpty: string;
        descriptionIfEmpty: string;
    };

    run: string;
    runPageTitle: string;
    tryItPageTitle: string;
    back: string;
    snippetNotTrusted: string;
    trust: string;
    cancel: string;
    switchToSnippet: string;
    snippetCodeChanged: string;
    refresh: string;
    dismiss: string;
    editingDifferentSnippet1: string;
    editingDifferentSnippet2: string;
    loadLatestSnippet: string;

    RuntimeHelpers: {
        unexpectedError: string;
        authenticationWasCancelledByTheUser: string;
        officeVersionDoesNotSupportAuthentication: string;
    };
}
