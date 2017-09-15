export function getEnglishStrings(): ServerStrings {
    const unexpectedError = 'An unexpected error occurred';

    return {
        error: 'Error',
        unexpectedError: unexpectedError,
        invalidHost: 'Invalid host',
        invalidId: 'Invalid ID',
        receivedInvalidAuthCode: 'Received invalid auth code',
        failedToAuthenticateUser: 'Failed to authenticate user',
        receivedInvalidSnippetData: 'Received invalid snippet data',
        unrecognizedScriptLanguage: 'Unrecognized script language',
        line: 'Line',

        getLoadingSnippetSubtitle: (snippetName: string) => `Loading "${snippetName}"`,

        loadingSnippetDotDotDot: 'Loading snippet...',

        getSyntaxErrorsTitle: (count: number) => (count === 1 ? 'Syntax error' : 'Syntax errors'),

        getGoBackToEditor: (editorUrl: string) =>
            `Welcome to Script Lab – but you probably want to be viewing the Editor, not the Runner page. Please return to ${editorUrl}`,

        createdWithScriptLab: 'Created with Script Lab',

        scriptLabRunner: 'Script Lab runner',
        versionInfo: 'Version info',

        manifestDefaults: {
            nameIfEmpty: 'Snippet',
            descriptionIfEmpty: 'Created with Script Lab'
        },

        run: 'Run',
        runPageTitle: 'Run snippet',
        back: 'Back',
        snippetNotTrusted: 'This snippet comes from an external source. You need to trust it before you can run it.',
        trust: 'Trust',
        cancel: 'Cancel',
        switchToSnippet: `Switch to the snippet that you're editing.`,
        snippetCodeChanged: 'You changed the code in this snippet. Refresh this pane to run the new version.',
        refresh: 'Refresh',
        dismiss: 'Dismiss',
        editingDifferentSnippet1: `You're now editing a different snippet`,
        editingDifferentSnippet2: `Refresh this pane to run it`,
        loadLatestSnippet: 'Load the latest snippet',

        RuntimeHelpers: {
            unexpectedError: unexpectedError,
            authenticationWasCancelledByTheUser: 'Authentication was cancelled by the user',
            officeVersionDoesNotSupportAuthentication:
                'Your current version of Office does not support displaying an authentication dialog. Please update to a newer version, or try Office Online, if you would like to run this snippet.'
        }
    };
}
