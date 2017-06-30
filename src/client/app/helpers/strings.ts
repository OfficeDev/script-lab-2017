import { stripSpaces } from '../helpers';

export class Strings {

    static readonly PlaygroundName = 'Script Lab';

    static readonly run = 'Run';
    static readonly runInThisPane = 'Run in this pane';
    static readonly runSideBySide = 'Run side-by-side';
    static readonly share = 'Share';
    static readonly delete = 'Delete';
    static readonly close = 'Close';

    static readonly okButtonLabel = 'OK';
    static readonly logoutButtonLabel = 'Sign out';
    static readonly cancelButtonLabel = 'Cancel';
    static readonly saveButtonLabel = 'Save';
    static readonly moreInfoButtonLabel = 'More info';
    static readonly importButtonLabel = 'Import';

    static readonly snippetImportError = 'Failed to import snippet';
    static readonly snippetImportErrorTitle = 'Import failed';
    static readonly snippetImportErrorBody = `We couldn't import the snippet.`;
    static readonly reloadPrompt = 'Reload this task pane and then try another URL or ID.';

    static readonly snippetSaveError = 'Failed to save the current snippet';
    static readonly snippetDupeError = 'Failed to duplicate the current snippet';
    static readonly snippetDeleteError = 'Failed to delete the current snippet';
    static readonly snippetDeleteAllError = 'Failed to delete all the local snippets';
    static readonly snippetLoadAllError = 'Failed to load the local snippets';
    static readonly snippetRunError = 'Failed to run the snippet';
    static readonly snippetLoadDefaultsError = 'Failed to load the default samples';


    /** NEEDS STRING REVIEW */
    static readonly snippetNoOfficeTitle = 'Cannot run this snippet';

    /** NEEDS STRING REVIEW */
    static readonly snippetNoOfficeMessage = 'You can only run Office snippets inside of an Office Add-in. Get your copy today at https://aka.ms/getscriptlab.';


    /** NEEDS STRING REVIEW */
    static readonly snippetUpdateError = 'Failed to update the snippet';

    static readonly snippetValidationEmpty = `Your snippet can't be empty`;
    static readonly snippetValidationNoTitle = 'Your snippet needs a title';


    static readonly defaultSnippetTitle = 'New Snippet';
    static readonly newSnippetTitle = 'Blank Snippet'; // string gets modified at runtime

    //ui.ts strings:
    static readonly dialogError = 'An error occurred in the dialog';
    static readonly dialogOpenError = 'A dialog is already open';

    //monaco.ts strings:
    static readonly intellisenseUpdateError = 'Failed to update IntelliSense';
    static readonly intellisenseClearError = 'Failed to clear IntelliSense';
    static readonly intellisenseLoadError = 'Failed to load the IntelliSense file';

    //github.ts strings:
    static readonly githubLoginFailed = 'Failed to sign in to GitHub';
    static readonly githubLogoutFailed = 'Failed to sign out of GitHub';
    static readonly profileCheckFailed = 'Failed to get the GitHub profile';
    static readonly gistRetrieveFailed = 'Failed to retrieve GitHub gists';
    static readonly gistDescriptionAppendage = `Shared with ${Strings.PlaygroundName}`;

    /** NEEDS STRING REVIEW */
    static readonly gistShareFailedBody = 'Failed to share the GitHub gist';
    static readonly gistShareFailedTitle = 'Sharing failed';

    static readonly gistSharedDialogStart = 'The URL of your GitHub gist is:';
    static readonly gistSharedDialogEnd = `To import your snippet, select the Import button in ${Strings.PlaygroundName} and enter this URL.`;
    static readonly gistSharedDialogTitle = 'Share your snippet';
    static readonly gistSharedDialogViewButton = 'View on GitHub';

    static readonly snippetCopiedConfirmation = `The snippet is copied to your clipboard`;
    static readonly snippetCopiedFailed = 'Failed to copy the snippet to your clipboard';

    static readonly snippetExportFailed = 'Failed to export the snippet';

    // Components strings
    // about.ts
    static readonly aboutUpdated = 'Last updated:';
    static readonly aboutStorage = 'Storage:';
    static readonly aboutSnippets = 'Local snippets';
    static readonly aboutIntellisense = 'IntelliSense';

    //snippet.info.ts
    static readonly nameLabel = 'Name';
    static readonly descriptionLabel = 'Description';

    /** NEEDS STRING REVIEW */
    static readonly gistUrlLabel = 'Gist URL';
    static readonly gistUrlLinkLabel = 'Open in browser';

    // Containers strings
    //app.ts

    /** NEEDS STRING REVIEW */
    static readonly shareMenuPublic = 'New Public Gist';
    static readonly shareMenuPrivate = 'New Secret Gist';
    static readonly updateMenu = 'Update Existing Gist';

    static readonly shareMenuClipboard = 'Copy to clipboard';
    static readonly shareMenuExport = 'Export for publishing';

    static readonly loginGithub = 'Sign in to GitHub';

    static readonly lightTheme = 'Light';
    static readonly darkTheme = 'Dark';

    static readonly deleteSnippetConfirm = 'Are you sure you want to delete this snippet?';

    static readonly editorTriggerSuggestContextMenuLabel = 'Trigger Suggest';

    /** NEEDS STRING REVIEW */
    static readonly sharePublicSnippetConfirm = 'Are you sure you want to share this snippet as a new public gist?';
    static readonly sharePrivateSnippetConfirm = 'Are you sure you want to share this snippet as a new secret gist?';

    static readonly tabDisplayNames = {
        'script': 'Script',
        'template': 'Template',
        'style': 'Style',
        'libraries': 'Libraries'
    };
    // Gallery.view strings

    static readonly snippetsTab = 'Snippets';
    static readonly samplesTab = 'Samples';

    static readonly noSnippetsMessage = 'You have no local snippets. You can create a new one, pick one of the samples, or import one from somewhere else.';
    static readonly noGistsMessage = `You haven't uploaded snippet to a gist yet. After you create or modify a snippet, you can choose Share to upload it.`;

    static readonly newSnippetDescription = 'Create a new snippet';
    static readonly importDescription = 'Create a snippet from YAML or a GitHub gist';

    // import.ts strings

    static readonly newSnippetLabel = 'New snippet';
    static readonly mySnippetsLabel = 'My snippets';
    static readonly samplesLabel = 'Samples';
    static readonly importLabel = 'Import snippet';
    static readonly mySnippetsDescription = 'Choose a snippet that you saved.';
    static readonly localSnippetsLabel = 'My snippets on this computer';
    static readonly noLocalSnippets = `You haven't saved snippets on this computer. To get started, create a new snippet or import one.`;
    static readonly sharedGistsLabel = 'My shared gists on GitHub';
    static readonly sharedGistsSignIn = 'Sign in to get any snippets you shared via GitHub gists.';
    static readonly samplesDescription = 'Choose one of the samples below to get started.';
    static readonly noSamplesMessage = `There aren't any samples available for this host yet.`;
    static readonly importWarning = `Imported snippets may contain malicious code. Don't run snippets unless you trust the source.`;
    static readonly importWarningAction = `Don't show this warning again.`;

    static readonly localStorageWarning = `Snippets you create get erased if you clear your browser cache. ` +
        `To save snippets permanently, export them as gists from the Share menu.`;
    static readonly localStorageWarningAction = `Don't show this warning again.`;

    static readonly importInstructions = `Enter the snippet's URL or paste the YAML below, then choose`;
    static readonly importUrlLabel = `Snippet URL or GitHub gist ID`;
    static readonly importUrlPlaceholder = `eg. https://gist.github.com/sampleGistId`;
    static readonly importYamlLabel = `Snippet YAML`;

    static readonly Refresh = {
        /** Error if refresh URL is somehow misformed (should essentially never happen) */
        missingSnippetParameters: `A configuration problem prevented the snippet from loading`,

        /** Error if snippet no longer exists */
        couldNotFindTheSnippet: `Couldn't find the snippet. It might have been deleted.`,

        /** Appends one of the following to the error message
         * (navigating back after a couple of seconds, if there is a return URL) */
        getErrorMessageAppendum: (returnUrl: string) =>
            returnUrl ? 'Returning...' : 'Close this window and try again.',

    };

    static readonly Runner = {
        snippetNoLongerExists: 'That snippet no longer exists. Reload this page, or return to the previous one.',
        unexpectedError: 'An unexpected error occurred',

        reloadingOfficeJs: 'Reloading Office.js',

        noSnippetIsCurrentlyOpened: `There isn't an open snippet in the Edit pane.`,

        getLoadingSnippetSubtitle(snippetName?: string) {
            return 'Loading ' + (snippetName ? `"${snippetName}"` : 'snippet');
        }
    };

    /** Error strings served by the server and displayed in the Error page */
    static readonly ServerError = {
        moreDetails: '(More details...)',
        hideDetails: '(Hide details...)'
    };

    static readonly SideBySideInstructions = {
        /** NEEDS STRING REVIEW */
        title: 'Run side-by-side with editor',

        /** NEEDS STRING REVIEW */
        message: stripSpaces(`
            To run the snippet side-by-side with the editor, choose "Run" in the Ribbon.

            Running side-by-side offers both a quicker refresh, and the added advantage of keeping your position and undo-history in the editor.`
        ),

        /** NEEDS STRING REVIEW */
        gotIt: 'Got it'
    };

}
