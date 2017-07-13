import { ClientStrings } from './index';

export function getEnglishStrings(): ClientStrings {
    const playgroundName = 'Script Lab';

    return {
        playgroundName: playgroundName,
        playgroundTagline: 'Code ● Run ● Share',

        // Environment names
        alpha: 'Alpha',
        beta: 'Beta',
        production: 'Production',

        userId: 'User ID',

        run: 'Run',
        runInThisPane: 'Run in this pane',
        runSideBySide: 'Run side-by-side',
        share: 'Share',
        delete: 'Delete',
        close: 'Close',
        about: 'About',
        feedback: 'Feedback',
        errors: 'Errors',
        dismiss: 'Dismiss',

        okButtonLabel: 'OK',
        logoutButtonLabel: 'Sign out',
        cancelButtonLabel: 'Cancel',
        saveButtonLabel: 'Save',
        moreInfoButtonLabel: 'More info',
        importButtonLabel: 'Import',
        editorTriggerSuggestContextMenuLabel: 'Trigger Suggest',

        snippetImportError: 'Failed to import snippet',
        snippetImportErrorTitle: 'Import failed',
        snippetImportErrorBody: `We couldn't import the snippet.`,
        reloadPrompt: 'Reload this task pane and then try another URL or ID.',

        snippetSaveError: 'Failed to save the current snippet',
        snippetDupeError: 'Failed to duplicate the current snippet',
        snippetDeleteError: 'Failed to delete the current snippet',
        snippetDeleteAllError: 'Failed to delete all the local snippets',
        snippetLoadAllError: 'Failed to load the local snippets',
        snippetRunError: 'Failed to run the snippet',
        snippetLoadDefaultsError: 'Failed to load the default samples',

        snippetNoOfficeTitle: /** NEEDS STRING REVIEW */ 'Cannot run this snippet',
        snippetNoOfficeMessage: /** NEEDS STRING REVIEW */ 'You can only run Office snippets inside of an Office Add-in. Acquire Script Lab for free today at https://aka.ms/getscriptlab.',

        snippetUpdateError: /** NEEDS STRING REVIEW */ 'Failed to update the snippet',

        snippetValidationEmpty: `Your snippet can't be empty`,
        snippetValidationNoTitle: 'Your snippet needs a title',

        defaultSnippetTitle: 'New Snippet',
        newSnippetTitle: 'Blank Snippet' /* string gets modified at runtime */,

        //ui.ts strings:
        dialogError: 'An error occurred in the dialog',
        dialogOpenError: 'A dialog is already open',

        //monaco.ts strings:
        intellisenseUpdateError: 'Failed to update IntelliSense',
        intellisenseClearError: 'Failed to clear IntelliSense',
        intellisenseLoadError: 'Failed to load the IntelliSense file',

        //github.ts strings:
        githubLoginFailed: 'Failed to sign in to GitHub',
        githubLogoutFailed: 'Failed to sign out of GitHub',
        profileCheckFailed: 'Failed to get the GitHub profile',
        gistRetrieveFailed: 'Failed to retrieve GitHub gists',
        gistDescriptionAppendage: `Shared with ${playgroundName}`,

        gistShareFailedBody: /** NEEDS STRING REVIEW */ 'Failed to share the GitHub gist',
        gistShareFailedTitle: 'Sharing failed',

        gistSharedDialogStart: 'The URL of your GitHub gist is:',
        gistSharedDialogEnd: `To import your snippet, select the Import button in ${playgroundName} and enter this URL.`,
        gistSharedDialogTitle: 'Share your snippet',
        gistSharedDialogViewButton: 'View on GitHub',
        gistUpdateUrlIsSameAsBefore: /** NEEDS STRING REVIEW */ 'The URL of your updated gist is the same as before:',
        gistUpdateSuccess: /** NEEDS STRING REVIEW */ 'Snippet successfully updated',

        snippetCopiedConfirmation: `The snippet is copied to your clipboard`,
        snippetCopiedFailed: 'Failed to copy the snippet to your clipboard',

        snippetExportFailed: 'Failed to export the snippet',
        snippetExportNotSupported: 'Snippet export is not yet supported on this version of Office. Supported platforms include Windows and Office Online.',

        // Components strings
        // about.ts
        // Syntax of {0}, {1}... is used for placeholders and should not be localized
        aboutUpdated: 'Last updated:',
        aboutStorage: 'Storage:',
        aboutSnippets: 'Local snippets',
        aboutIntellisense: 'IntelliSense',
        aboutCurrentEnvironment: /** NEEDS STRING REVIEW */ 'Current Environment:',
        aboutSwitchEnvironment: /** NEEDS STRING REVIEW */ 'Switch from {0} to {1}:',
        changeEnvironmentConfirm: /** NEEDS STRING REVIEW */ 'You are about to change your Script Lab environment and will not have access to your saved local snippets until you return to this environment. Are you sure you want to proceed?',

        //snippet.info.ts
        snippetInfoDialogTitle: 'Info',
        nameLabel: 'Name',
        descriptionLabel: 'Description',
        namePlaceholder: 'Snippet name',
        descriptionPlaceholder: 'Snippet description',
        gistUrlLabel: /** NEEDS STRING REVIEW */ 'Gist URL',
        gistUrlLinkLabel: /** NEEDS STRING REVIEW */ 'Open in browser',

        // Containers strings
        //app.ts

        shareMenuPublic: /** NEEDS STRING REVIEW */ 'New public gist',
        shareMenuPrivate: /** NEEDS STRING REVIEW */ 'New secret gist',
        updateMenu: /** NEEDS STRING REVIEW */ 'Update existing gist',
        sharePublicSnippetConfirm: /** NEEDS STRING REVIEW */ 'Are you sure you want to re-share this snippet as a brand new public gist?',
        sharePrivateSnippetConfirm: /** NEEDS STRING REVIEW */ 'Are you sure you want to re-share this snippet as a brand new secret gist?',

        shareMenuClipboard: 'Copy to clipboard',
        shareMenuExport: 'Export for publishing',

        loginGithub: 'Sign in to GitHub',

        lightTheme: 'Light',
        darkTheme: 'Dark',

        deleteSnippetConfirm: 'Are you sure you want to delete this snippet?',

        tabDisplayNames: {
            'script': 'Script',
            'template': 'Template',
            'style': 'Style',
            'libraries': 'Libraries'
        },

        // Gallery.view strings

        snippetsTab: 'Snippets',
        samplesTab: 'Samples',

        noSnippetsMessage: 'You have no local snippets. You can create a new one, pick one of the samples, or import one from somewhere else.',
        noGistsMessage: `You haven't uploaded snippet to a gist yet. After you create or modify a snippet, you can choose Share to upload it.`,

        newSnippetDescription: 'Create a new snippet',
        importDescription: 'Create a snippet from YAML or a GitHub gist',

        // import.ts strings

        newSnippetLabel: 'New snippet',
        mySnippetsLabel: 'My snippets',
        samplesLabel: 'Samples',
        importLabel: 'Import snippet',
        mySnippetsDescription: 'Choose a snippet that you saved.',
        localSnippetsLabel: 'My snippets on this computer',
        noLocalSnippets: `You haven't saved snippets on this computer. To get started, create a new snippet or import one.`,
        sharedGistsLabel: 'My shared gists on GitHub',
        sharedGistsSignIn: 'Sign in to get any snippets you shared via GitHub gists.',
        samplesDescription: 'Choose one of the samples below to get started.',
        noSamplesMessage: `There aren't any samples available for this host yet.`,
        importWarning: `Imported snippets may contain malicious code. Don't run snippets unless you trust the source.`,
        importWarningAction: `Don't show this warning again.`,

        localStorageWarning: `Snippets you create get erased if you clear your browser cache. ` +
        `To save snippets permanently, export them as gists from the Share menu.`,
        localStorageWarningAction: `Don't show this warning again.`,

        importInstructions: `Enter the snippet's URL or paste the YAML below, then choose`,
        importUrlLabel: `Snippet URL or GitHub gist ID`,
        importUrlPlaceholder: `eg. https://gist.github.com/sampleGistId`,
        importYamlLabel: `Snippet YAML`,

        Refresh: {
            /** Error if refresh URL is somehow misformed (should essentially never happen) */
            missingSnippetParameters: `A configuration problem prevented the snippet from loading.`,

            /** Error if snippet no longer exists */
            couldNotFindTheSnippet: `Couldn't find the snippet. It might have been deleted.`,

            /** Appends one of the following to the error message
             * (navigating back after a couple of seconds, if there is a return URL) */
            getTextToAppendToErrorMessage: (returnUrl: string) =>
                returnUrl ? 'Returning...' : 'Close this window and try again.'
        },

        Runner: {
            snippetNoLongerExists: 'That snippet no longer exists. Reload this page, or return to the previous one.',
            unexpectedError: 'An unexpected error occurred',

            reloadingOfficeJs: 'Reloading Office.js',

            noSnippetIsCurrentlyOpened: `There isn't an open snippet in the Edit pane.`,

            getLoadingSnippetSubtitle: (snippetName?: string) => {
                return 'Loading ' + (snippetName ? `"${snippetName}"` : 'snippet');
            }
        },

        /** Error strings served by the server and displayed in the Error page */
        ServerError: {
            moreDetails: 'More details...',
            hideDetails: 'Hide details...'
        },

        SideBySideInstructions: {
            title: /** NEEDS STRING REVIEW */ 'Run side-by-side with editor',

            message: /** NEEDS STRING REVIEW */[
                'To run the snippet side-by-side with the editor, choose "Run" in the Ribbon.',
                '',
                'Running side-by-side offers both a quicker refresh, and the added advantage of keeping your position and undo-history in the editor.'
            ].join('\n'),

            gotIt: /** NEEDS STRING REVIEW */ 'Got it'
        },

        HtmlPageStrings: {
            PageTitles: {
                code: 'Code',
                run: 'Run',
                tutorial: 'Tutorial'
            },

            chooseYourHost: 'Choose your host:',

            localStorageUnavailableMessage:
            'Cannot initialize Script Lab because the browser\'s Local Storage is disabled. ' +
            ' Please try on a different browser or computer, or check your internet settings.',

            loadingRunnerDotDotDot: 'Loading runner...',
            running: 'Running',
            lastOpenedSnippet: 'Last opened snippet',
            noLastOpenedSnippets: 'You have no last opened snippet.',
            toGetStartedCreateOrImportSnippet: 'To get started, create or import a snippet via the "Code" button.',
            mySavedSnippets: 'My saved snippets',
            noLocalSnippets: 'You have no local snippets.',
            lastUpdated: 'Last updated',
            clickToRefresh: 'Click to refresh',

            tutorialDescription: 'This Excel file shows you how to use Script Lab in a few easy steps:',
            download: 'Download',
            errorInitializingScriptLab: 'Error initializing Script Lab.'
        }
    };
}
