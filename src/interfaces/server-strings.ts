interface ServerStrings {
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
    loadingSnippetDotDotDot: string;
    getSyntaxErrorsTitle(count: number): string

    getGoBackToEditor(editorUrl: string): string

    createdWithScriptLab: string;

    scriptLabRunner: string;
    versionInfo: string;

    manifestDefaults: {
        nameIfEmpty: string;
        descriptionIfEmpty: string;
    };

    run: string;
    runPageTitle: string;
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
