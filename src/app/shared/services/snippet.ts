import { Utilities } from '../helpers';
import * as md5 from 'js-md5';

export class Snippet {
    private _hash: string;

    constructor(public content: ISnippet) {
        if (content == null) {
            // TODO: Handle empty snippet error here.
        }

        if (Utilities.isEmpty(content.id)) {
            content.id = Utilities.guid();
        }
    }

    get isUpdated() {
        let newHash = this.hash();
        if (this._hash !== newHash) {
            this._hash = newHash;
            return true;
        }
        else {
            return false;
        }
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

    public hash(): string {
        if (this.content == null) {
            // TODO: Throw and error here
        }
        return md5(JSON.stringify(this.content));
    }
}