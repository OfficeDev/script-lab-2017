import { Utilities, PlaygroundError } from '../helpers';
import * as crypto from 'crypto-js';
import * as _ from 'lodash';

export class Snippet {
    private _hash: string;

    constructor(public content: ISnippet) {
        if (_.isEmpty(this.content)) {
            throw new PlaygroundError('Snippet creation failed. No content was received');
        }

        if (_.isEmpty(this.content.id)) {
            this.content.id = Utilities.guid();
        }

        this._hash = this._generateHash();
    }

    get isUpdated() {
        let newHash = this._generateHash();
        return this._hash !== newHash;
    }

    get typings(): string[] {
        if (_.isEmpty(this.content)) {
            return [];
        }
        try {
            return this.content.libraries.split('\n').filter(library => /(?:d.ts$|^dt~)/gmi.test(library));
        }
        catch (exception) {
            return [];
        }
    }

    public updateHash() {
        this._hash = this._generateHash();
    }

    private _generateHash(): string {
        if (_.isEmpty(this.content)) {
            throw new PlaygroundError('Snippet hash failed. Cannot create hash of null or undefined');
        }

        return crypto.SHA1(JSON.stringify(this.content)).toString();
    }
}
