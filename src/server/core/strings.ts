export class Strings {
    static unexpectedError: 'An unexpected error occurred';

    /** NEEDS STRING REVIEW */
    static getInitialLoadSubtitle(snippetName: string) {
        return `Loading "${snippetName}"`;
    }

    static getSyntaxErrorsTitle(count: number) {
        return count === 1 ? 'Syntax error' : 'Syntax errors';
    }
}
