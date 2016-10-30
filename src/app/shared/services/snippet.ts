import * as md5 from 'js-md5';

export class Snippet {
    lastSavedHash: string;

    constructor(public content: ISnippet) {
        this.lastSavedHash = this.getHash();
    }

    get typings(): string[] {
        return this.content.libraries.filter(library => /(?:d.ts$|^dt~)/gmi.test(library));
    }

    get libraries(): string {
        return this.content.libraries.join('\n');
    }

    set libraries(value: string) {
        this.content.libraries = value.split('\n');
    }

    public getHash(): string {
        return md5(JSON.stringify(this.content));
    }
}

export enum SnippetNamingSuffixOption {
    StripNumericSuffixAndIncrement, /* for new snippets */
    UseAsIs, /* i.e., for import */
    AddCopySuffix /* for duplicate */
}