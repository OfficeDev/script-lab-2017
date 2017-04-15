export class Strings {
    static unexpectedError: 'An unexpected error occurred';

    static getLoadingSnippetSubtitle(snippetName: string) {
        return `Loading "${snippetName}"`;
    }

    static getSyntaxErrorsTitle(count: number) {
        return count === 1 ? 'Syntax error' : 'Syntax errors';
    }
}
