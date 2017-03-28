export class Strings {
    static readonly PlaygroundName = 'Project Bornholm';

    static readonly run = 'Run';
    static readonly share = 'Share';
    static readonly delete = 'Delete';
    static readonly close = 'Close';

    static readonly okButtonLabel = 'OK';
    static readonly logoutButtonLabel = 'Sign out';
    static readonly cancelButtonLabel = 'Cancel';
    static readonly saveButtonLabel = 'Save';
    static readonly moreInfoButtonLabel = 'More info';
    static readonly importButtonLabel = 'Import';
    

    // effects strings
    //snippet.ts strings:

    static readonly snippetImportError = 'Failed to import snippet';
    static readonly snippetImportErrorTitle = 'Import failed';
    static readonly snippetImportErrorBody = `We couldn't import the snippet. Check your GIST ID or URL.`;

    static readonly snippetSaveError = 'Failed to save the current snippet';
    static readonly snippetDupeError = 'Failed to duplicate the current snippet';
    static readonly snippetDeleteError = 'Failed to delete the current snippet';
    static readonly snippetDeleteAllError = 'Failed to delete all the local snippets';
    static readonly snippetLoadAllError = 'Failed to load the local snippets';
    static readonly snippetRunError = 'Failed to run the snippet';
    static readonly snippetLoadDefaultsError = 'Failed to load the default samples';

    static readonly snippetValidationEmpty = `Your snippet can't be empty`;
    static readonly snippetValidationNoTitle = 'Your snippet needs a title';


    static readonly defaultSnippetTitle = 'New Snippet'; // not sure how it's different from newSnippet
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
    static readonly gistShareFailed = 'Failed to share the GitHub gist';
    static readonly gistDescriptionAppendage = `Shared with ${Strings.PlaygroundName}`;

    static readonly gistSharedDialogStart = 'The URL of your GitHub gist is:';
    static readonly gistSharedDialogEnd = `To import your snippet, select the Import button in ${Strings.PlaygroundName} and enter this URL.`;
    static readonly gistSharedDialogTitle = 'Share your snippet';
    static readonly gistSharedDialogViewButton = 'View on GitHub';

    static readonly snippetCopiedConfirmation = `The snippet is copied to your clipboard`;
    static readonly snippetCopiedFailed = 'Failed to copy the snippet to your clipboard';

    // Components strings
    // about.ts
    static readonly aboutUpdated = 'Last updaated:';
    static readonly aboutStorage = 'Storage:';
    static readonly aboutSnippets = 'Local snippets';
    static readonly aboutIntellisense = 'IntelliSense';

    //snippet.info.ts
    static readonly nameLabel = 'Name';
    static readonly descriptionLabel = 'Description';

    // Containers strings
    //app.ts

    static readonly shareMenuPublic = 'Public gist';
    static readonly shareMenuPrivate = 'Secret gist';
    static readonly shareMenuClipboard = 'Copy to clipboard';

    static readonly loginGithub = 'Sign in to GitHub';

    static readonly lightTheme = 'Light';
    static readonly darkTheme = 'Dark';

    static readonly deleteSnippetConfirm = 'Are you sure you want to delete this snippet?';

    // Editor strings, none are used since there's some kind of literal string dependency - that should be fixed

    static readonly scriptTab = 'Script';
    static readonly htmlTab = 'Template';
    static readonly cssTab = 'Style';
    static readonly librariesTab = 'Libraries';
    static readonly scriptTabTag = Strings.scriptTab.toLowerCase();
    static readonly htmlTabTag = 'template';
    static readonly cssTabTag = Strings.cssTab.toLowerCase();
    static readonly librariesTabTag = Strings.librariesTab.toLowerCase();

    // Gallery.view strings

    static readonly snippetsTab = 'Snippets';
    static readonly samplesTab = 'Samples';

    static readonly noSnippetsMessage = 'You have no local snippets. You can create a new one, pick one of the samples, or import one from somewhere else.';
    static readonly noGistsMessage = `You haven't uploaded snippet to a gist yet. After you create or modify a snippet, you can choose Share to upload it.`;

    static readonly newSnippetDescription = 'Create a new snippet';
    static readonly importDescription = 'Create a snippet from YAML or a GitHub gist';

    static readonly localStorageWarning = `Snippets are erased if you clear your browser cache.

                    To save permanent copies of your snippets, export them as gists from the Share menu.`;
    static readonly deleteLocalSnippets = 'Are you sure you want to delete all your local snippets?';
    static readonly deleteLocalSnippetsTitle = `Delete local snippets`;

    // import.ts strings

    static readonly newSnippetLabel = 'New snippet';
    static readonly mySnippetsLabel = 'My snippets';
    static readonly samplesLabel = 'Samples';
    static readonly importLabel = 'Import snippets';
    static readonly mySnippetsDescription = 'Choose a snippet that you saved.';
    static readonly localSnippetsLabel = 'My snippets on this computer';
    static readonly noLocalSnippets = `You haven't saved snippets on this computer. To get started, create a new snippet or import one.`;
    static readonly sharedGistsLabel = 'My shared gists on GitHub';
    static readonly sharedGistsSignIn = 'Sign in to get any snippets you shared via GitHub gists.';
    static readonly samplesDescription = 'Choose one of the samples below to get started.';
    static readonly noSamplesMessage = `There aren't any samples available for this host yet.`;
    
    //static readonly importUrlTab = 'From URL';
    static readonly importYamlTab = 'Paste code';
    static readonly importUrlDescription = `Paste the snippet's URL or GitHub gist ID, then choose Import.`;
    static readonly importUrlTextBoxLabel = 'URL or gist ID';
    static readonly importUrlTextBoxPlaceholder = 'Enter the URL or GitHub gist ID here';
    static readonly urlExamplesTitle = 'Examples:';
    static readonly urlExample1 = `https://gist.github.com/sampleGistId`;
    static readonly urlExample2 = `https://addin-playground.azurewebsites.net/#/gist/sampleGistId`;
    static readonly urlExample3 = `https://mywebsite.com/myfolder/mysnippet.yaml`;
    static readonly urlExample4 = 'Or you can enter just the gist ID';
    static readonly importYamlDescription = `Paste the snippet's YAML code, then choose Import.`;
    static readonly importYamlTextBoxLabel = 'YAML';


    static readonly Refresh = {
        /** NEEDS STRING REVIEW. Error if refresh URL is somehow misformed (should essentially never happen) */
        missingSnippetParameters: 'Missing some snippet parameters.',

        /** NEEDS STRING REVIEW. Error if snippet no longer exists */
        couldNotFindTheSnippet: 'Could not find the snippet.',

        /** NEEDS STRING REVIEW. Appends one of the following to the error message
         * (navigating back after a couple of seconds, if there is a return URL) */
        getErrorMessageAppendum: (returnUrl: string) =>
            returnUrl ? 'Returning...' : 'Please close this window and try again.',

    };

    static readonly Runner = {
        /** NEEDS STRING REVIEW */
        snippetNoLongerExists: 'Snippet no longer exists. Please reload this page, or return to the previous one.',

        /** NEEDS STRING REVIEW */
        unexpectedError: 'An unexpected error had occurred',

        /** NEEDS STRING REVIEW. */
        getCouldNotRefreshSnippetText: (e: Error) => {
            if (!e || e.message === '' || e.toString() === '' || e.toString() === '[object Object]') {
                return 'Could not refresh the snippet';
            } else {
                return 'Could not refresh the snippet due to the following error: ' +
                    e.message || e.toString();
            }
        },

        /** NEEDS STRING REVIEW */
        reloadingOfficeJs: 'Reloading Office.js'
    };
}
