import { Injectable } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes } from './request';
import * as _ from 'lodash';

@Injectable()
export class Intellisense {
    private _cache: Dictionary<string>;

    constructor(private _request: Request) {
        this._cache = new Dictionary<string>();
    }

    private _intellisenseFile = (this._request.local<any[]>('libraries.json', ResponseTypes.JSON) as Promise<any[]>);

    private _typings: Promise<monaco.languages.CompletionItem[]>;
    get typings() {
        if (this._typings == null) {
            this._typings = this._intellisenseFile.then(
                item => item
                    .filter(({typings}) => !_.isEmpty(typings))
                    .map(({typings, documentation}) => <monaco.languages.CompletionItem>{
                        label: typings,
                        documentation: documentation,
                        kind: monaco.languages.CompletionItemKind.Module,
                        insertText: `${typings}\n`
                    })
            );
        }

        return this._typings;
    }

    private _libraries: Promise<monaco.languages.CompletionItem[]>;
    get libraries() {
        if (this._libraries == null) {
            this._libraries = this._intellisenseFile.then(
                item => item
                    .filter(({label}) => !_.isEmpty(label))
                    .map(({label, documentation}) => <monaco.languages.CompletionItem>{
                        label: label,
                        documentation: documentation,
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: `${label}\n`,
                    })
            );
        }

        return this._libraries;
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
                else if (/\.d\.ts$/i.test(library)) {
                    if (/^https?:/i.test(library)) {
                        urls.push(library);
                    }
                    else {
                        urls.push(`https://unpkg.com/${library}`);
                    }
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
        return this._request.get<string>(filePath, null, ResponseTypes.RAW)
            .then(content => {
                this._cache.add(content, filePath);
                return { content, filePath };
            });
    }

    private _tryGetCached = filePath => {
        return this._cache.contains(filePath) ?
            Promise.resolve({ filePath, content: this._cache.get(filePath) }) :
            this.fetch(filePath);
    }
}
