import * as md5 from 'js-md5';

export class Snippet {
    lastSavedHash: string;

    constructor(public content?: ISnippet) {
        if (content == null) {
            // TODO: Create default snippet here from json.
        }
        this.lastSavedHash = this.getHash();
    }

    get typings(): string[] {
        if (this.content == null) {
            return [];
        }
        return this.content.libraries.filter(library => /(?:d.ts$|^dt~)/gmi.test(library));
    }

    get libraries(): string {
        if (this.content == null) {
            return '';
        }
        return this.content.libraries.join('\n');
    }

    set libraries(value: string) {
        if (this.content == null) {
            // TODO: Throw an error here
            return;
        }
        this.content.libraries = value.split('\n');
    }

    public getHash(): string {
        if (this.content == null) {
            // TODO: Throw and error here
        }
        return md5(JSON.stringify(this.content));
    }
}

export enum SnippetNamingSuffixOption {
    StripNumericSuffixAndIncrement, /* for new snippets */
    UseAsIs, /* i.e., for import */
    AddCopySuffix /* for duplicate */
}