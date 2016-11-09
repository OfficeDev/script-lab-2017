import { Injectable } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Request } from './request';

@Injectable()
export class Intellisense {
    private _libraries: Dictionary<string>;

    constructor(private _request: Request) {
        this._libraries = new Dictionary<string>();
    }

    get(url: string) {
        return this._tryGetCached(url);
    }

    all(urls: string[]) {
        return urls.map(url => this._tryGetCached(url));
    }

    fetch(filePath: string) {
        return this._request.get<string>(filePath)
            .then(content => {
                this._libraries.add(content, filePath);
                return { content, filePath };
            });
    }

    private _tryGetCached = filePath => {
        return this._libraries.contains(filePath) ?
            Promise.resolve({ filePath, content: this._libraries.get(filePath) }) :
            this.fetch(filePath);
    }
}
