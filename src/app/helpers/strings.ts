export class Strings {
   
    static playgroundName = 'API Explorer';

    static run = 'Run';
    static share = 'Share';
    static delete = 'Delete';
    
    static okButtonLabel = 'OK';
    static logoutButtonLabel = 'Sign out';
    static cancelButtonLabel = 'Cancel';
    static saveButtonLabel = 'Save';
    static moreInfoButtonLabel = 'More info';
    static importButtonLabel = 'Import';

    // effects strings
        //snippet.ts strings:

        static snippetImportError = 'Failed to import snippet';
        static snippetImportErrorTitle = 'Import failed';
        static snippetImportErrorBody = `We couldn't import the snippet. Check your GIST ID or URL.`;

        static snippetSaveError = 'Failed to save the current snippet';
        static snippetDupeError = 'Failed to duplicate the current snippet';
        static snippetDeleteError ='Failed to delete the current snippet';
        static snippetDeleteAllError = 'Failed to delete all the local snippets';
        static snippetLoadAllError = 'Failed to load the local snippets';
        static snippetRunError = 'Failed to run the snippet';
        static snippetLoadDefaultsError = 'Failed to load the default samples';

        static snippetValidationEmpty = `Your snippet can't be empty`;
        static snippetValidationNoTitle = 'Your snippet needs a title';

        
        static defaultSnippetTitle = 'New Snippet'; // not sure how it's different from newSnippet
        static newSnippetTitle = 'Blank Snippet'; // string gets modified at runtime

        //ui.ts strings:
        static dialogError = 'An error occurred in the dialog';
        static dialogOpenError = 'A dialog is already open';

        //monaco.ts strings:
        static intellisenseUpdateError = 'Failed to update IntelliSense';
        static intellisenseClearError = 'Failed to clear IntelliSense';
        static intellisenseLoadError = 'Failed to load the IntelliSense file';

        //github.ts strings:

        static githubLoginFailed = 'Failed to sign in to GitHub';
        static githubLogoutFailed = 'Failed to sign out of GitHub';
        static profileCheckFailed = 'Failed to get the GitHub profile';
        static gistRetrieveFailed = 'Failed to retrieve GitHub gists';
        static gistShareFailed = 'Failed to share the GitHub gist';
        static gistDescriptionAppendage = `Shared with ${Strings.playgroundName}`;

        static gistSharedDialogStart = 'The URL of your GitHub gist is:';
        static gistSharedDialogEnd = `To import your snippet, select the Import button in ${Strings.playgroundName} and enter this URL.`;
        static gistSharedDialogTitle = 'Share your snippet';
        static gistSharedDialogViewButton = 'View on GitHub';

        static snippetCopiedConfirmation = `The snippet is copied to your clipboard`;
        static snippetCopiedFailed = 'Failed to copy the snippet to your clipboard';
    
    // Components strings
        // about.ts
        static aboutUpdated = 'Last updated:';
        static aboutStorage = 'Storage:';
        static aboutSnippets = 'Local snippets';
        static aboutIntellisense = 'IntelliSense';

        //snippet.info.ts
        static nameLabel = 'Name';
        static descriptionLabel = 'Description';

    // Containers strings
        //app.ts
        
        static shareMenuPublic = 'Public gist';
        static shareMenuPrivate = 'Private gist';
        static shareMenuClipboard = 'Copy to clipboard';
        
        static loginGithub = 'Sign in to GitHub';

        static lightTheme = 'Light';
        static darkTheme = 'Dark';

        static deleteSnippetConfirm = 'Are you sure you want to delete this snippet?';
    
    // Editor strings, none are used since there's some kind of literal string dependency - that should be fixed

        static scriptTab = 'Script';
        static htmlTab = 'Template';
        static cssTab = 'Style';
        static librariesTab = 'Libraries';
        static scriptTabTag = Strings.scriptTab.toLowerCase();
        static htmlTabTag = 'template';
        static cssTabTag = Strings.cssTab.toLowerCase();
        static librariesTabTag = Strings.librariesTab.toLowerCase();
        
    // Gallery.view strings

        static snippetsTab = 'Snippets';
        static samplesTab = 'Samples';

        static noSnippetsMessage = 'You have no local snippets. You can create a new one, pick one of the samples, or import one from somewhere else.';
        static noGistsMessage = `You haven't uploaded snippet to a gist yet. After you create or modify a snippet, you can choose Share to upload it.`;

        static newSnippetDescription = 'Create a new snippet';
        static importDescription = 'Create a snippet from YAML or a GitHub gist';

        static localStorageWarning = `Snippets are erased if you clear your browser cache.

                    To save permanent copies of your snippets, export them as gists from the Share menu.`
        static deleteLocalSnippets = 'Are you sure you want to delete all your local snippets?'
        static deleteLocalSnippetsTitle = `Delete local snippets`;

    // import.ts strings

        static importUrlTab = 'From URL';
        static importYamlTab = 'Paste code';
        static importUrlDescription = `Paste the snippet's URL or GitHub gist ID, then choose Import.`
        static importUrlTextBoxLabel = 'URL or gist ID';
        static importUrlTextBoxPlaceholder = 'Enter the URL or GitHub gist ID here';
        static urlExamplesTitle = 'Examples:';
        static urlExample1 = `https://gist.github.com/sampleGistId`;
        static urlExample2 = `https://addin-playground.azurewebsites.net/#/gist/sampleGistId`;
        static urlExample3 = `https://mywebsite.com/myfolder/mysnippet.yaml`;
        static urlExample4 = 'Or you can enter just the gist ID';
        static importYamlDescription = `Paste the snippet's YAML code, then choose Import.`;
        static importYamlTextBoxLabel = 'YAML';

}