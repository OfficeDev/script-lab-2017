export class Strings {
    static unexpectedError: 'An unexpected error occurred';

    /** NEEDS STRING REVIEW */
    static getInitialLoadSubtitle(isError: boolean, snippetName: string) {
        return `${isError ? 'Error loading' : 'Loading'} "${snippetName}"`;
    }
}
