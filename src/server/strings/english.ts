import { ServerStrings } from './index';

export class EnglishStrings implements ServerStrings {
    error: 'Error';

    unexpectedError: 'An unexpected error occurred';

    getLoadingSnippetSubtitle(snippetName: string) {
        return `Loading "${snippetName}"`;
    }

    getSyntaxErrorsTitle(count: number) {
        return count === 1 ? 'Syntax error' : 'Syntax errors';
    }

    getGoBackToEditor(editorUrl: string) {
        return `Welcome to Script Lab – but you probably want to be viewing the Editor, not the Runner page. Please return to ${editorUrl}`;
    }

    createdWithScriptLab = 'Created with Script Lab';

    manifestDefaults = {
        nameIfEmpty: 'Snippet',
        descriptionIfEmpty: 'Created with Script Lab'
    };
}
