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

    parse(libraries: string[]) {
        let urls = [];
        libraries
            .forEach(library => {
                if (/^@types/.test(library)) {
                    urls.push(`https://unpkg.com/${library}/index.d.ts`);
                }
                else if (/^dt~/.test(library)) {
                    let libName = library.split('dt~')[1];
                    urls.push(`https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/${libName}/${libName}.d.ts`);
                }
                else if (/^https?:/i.test(library) && /\.d\.ts$/i.test(library)) {
                    urls.push(library);
                }
            });

        return urls;
    }

    all(urls: string[]): Promise<{ filePath: string, content: string }>[] {
        if (urls == null) {
            return [];
        }
        return urls.map(url => this._tryGetCached(url));
    }

    fetch(filePath: string) {
        return this._request.get<string>(filePath, null, true)
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
