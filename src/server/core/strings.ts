export class Strings {
    static error: 'Error';

    static unexpectedError: 'An unexpected error occurred';

    static getLoadingSnippetSubtitle(snippetName: string) {
        return `Loading "${snippetName}"`;
    }

    static getSyntaxErrorsTitle(count: number) {
        return count === 1 ? 'Syntax error' : 'Syntax errors';
    }

    static getGoBackToEditor(editorUrl: string) {
        return `Welcome to Script Lab – but you probably want to be viewing the Editor, not the Runner page. Please return to ${editorUrl}`;
    }

    static createdWithScriptLab = 'Created with Script Lab';
}
