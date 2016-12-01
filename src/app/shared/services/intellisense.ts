import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities, Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes } from './request';
import { Monaco } from './monaco';
import * as _ from 'lodash';

export interface IIntellisenseFile {
    url: string;
    content: string;
};

export interface IDisposableFile {
    url: string;
    disposable: monaco.IDisposable;
    retain?: boolean;
}

@Injectable()
export class Intellisense {
    private _cache: Storage<string>;
    private _current: Dictionary<IDisposableFile>;

    constructor(private _request: Request) {
        this._cache = new Storage<string>('IntellisenseCache', StorageType.SessionStorage);
        this._current = new Dictionary<IDisposableFile>();
    }

    parse(libraries: string[]): Observable<string> {
        return Observable.from(libraries)
            .map(library => {
                if (/^@types/.test(library)) {
                    return `https://unpkg.com/${library}/index.d.ts`;
                }
                else if (/^dt~/.test(library)) {
                    let libName = library.split('dt~')[1];
                    return `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/${libName}/${libName}.d.ts`;
                }
                else if (/\.d\.ts$/i.test(library)) {
                    if (/^https?:/i.test(library)) {
                        return library;
                    }
                    else {
                        return `https://unpkg.com/${library}`;
                    }
                }
            });
    }

    get(url: string): Observable<IIntellisenseFile> {
        if (this._cache.contains(url)) {
            return Observable.of({ url, content: this._cache.get(url) });
        }
        else {
            return this._request.get<string>(url, null, ResponseTypes.TEXT)
                .map(content => this._cache.insert(url, content))
                .map(content => ({ content, url }));
        }
    }

    async updateIntellisense(libraries: string[], isJavaScript: Boolean = false) {
        let monaco = await Monaco.current;
        let source = isJavaScript ?
            monaco.languages.typescript.javascriptDefaults :
            monaco.languages.typescript.typescriptDefaults;

        return this.parse(libraries)
            .filter(url => !(url == null))
            .flatMap<IIntellisenseFile>(url => this.get(url))
            .map(file => {
                let intellisense = this._current.get(file.url);
                if (intellisense == null) {
                    let disposable = source.addExtraLib(file.content, file.url);
                    intellisense = this._current.add(file.url, { url: file.url, disposable, retain: true });
                }
                else {
                    intellisense.retain = true;
                }
            })
            .subscribe(null, Utilities.log, () =>
                this._current.values().forEach(file => {
                    if (!file.retain) {
                        file.disposable.dispose();
                        this._current.remove(file.url);
                    }
                    else {
                        file.retain = false;
                    }
                }));
    }
}
