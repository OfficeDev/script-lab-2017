export class Strings {
    
    static playgroundName = 'Add-in Playground';
    
    //snippet.ts strings:
    
    static okButtonLabel = 'OK';

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
    static gistDescriptionAppendage = 'Shared with ' + Strings.playgroundName;


}