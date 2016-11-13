import { Utilities } from '../helpers';
import * as crypto from 'crypto-js';
import * as _ from 'lodash';

export class Snippet {
    private _hash: string;

    constructor(public content: ISnippet) {
        if (content == null) {
            // TODO: Handle empty snippet error here.
        }

        if (_.isEmpty(content.id)) {
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
        try {
            return this.content.libraries.split('\n').filter(library => /(?:d.ts$|^dt~)/gmi.test(library));
        }
        catch (exception) {
            return [];
        }
    }

    public hash(): string {
        if (this.content == null) {
            // TODO: Throw and error here
        }
        return crypto.SHA1(JSON.stringify(this.content));
    }
}
