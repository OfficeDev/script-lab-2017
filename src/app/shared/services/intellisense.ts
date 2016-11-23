import { Injectable } from '@angular/core';
import { Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes } from './request';
import { Monaco } from './monaco';
import * as _ from 'lodash';

@Injectable()
export class Intellisense {
    private _cache: Storage<string>;
    private intellisense = new Dictionary<Dictionary<monaco.IDisposable>>();

    constructor(private _request: Request) {
        this._cache = new Storage<string>('IntellisenseCache', StorageType.SessionStorage);
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

    all(urls: string[]): Promise<{ filePath: string, content: string }[]> {
        if (urls == null) {
            return Promise.resolve([]) as any;
        }
        let promises = urls.map(url => this._tryGetCached(url));
        return Promise.all(promises);
    }

    async fetch(filePath: string) {
        let content = await this._request.get<string>(filePath, null, ResponseTypes.RAW);
        this._cache.insert(filePath, content);
        return { content, filePath };
    }

    private _tryGetCached = filePath => {
        return this._cache.contains(filePath) ?
            Promise.resolve({ filePath, content: this._cache.get(filePath) }) :
            this.fetch(filePath);
    }

    async updateLibs(language: string, libraries: string[]) {
        let monaco = await Monaco.current;
        let urls = this.parse(libraries);
        let languageCollection = this.intellisense.get(language);
        let typings = await this.all(urls);
        if (languageCollection == null) {
            typings.forEach(({content, filePath}) => this.addLib(language, content, filePath));
        }
        else {
            let addedLibraries = _.differenceWith(typings, languageCollection.keys(), (newLib, loadedFile) => newLib.filePath === loadedFile);
            let removedLibraries = _.differenceWith(languageCollection.keys(), typings, (loadedFile, newLib) => newLib.filePath === loadedFile);

            addedLibraries.forEach(({ content, filePath }) => {
                this.addLib(language, content, filePath);
            });

            removedLibraries.forEach(item => this.removeLib(language, item));
        }
    }

    async addLib(language: string, content: string, filePath: string) {
        let monaco = await Monaco.current;
        let instance: monaco.IDisposable;
        language = language.toLowerCase().trim();

        let languageCollection = this.intellisense.get(language);
        if (languageCollection == null) {
            languageCollection = this.intellisense.add(language, new Dictionary<monaco.IDisposable>());
        }

        if (languageCollection.contains(filePath)) {
            return;
        }

        switch (language) {
            case 'typescript':
                instance = monaco.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
                break;

            case 'javascript':
                instance = monaco.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
                break;

            case 'css': break;
            case 'json': break;
            case 'html': break;
            default: break;
        }

        if (instance == null) {
            return;
        }

        return languageCollection.add(filePath, instance);
    }

    async removeLib(language: string, filePath: string) {
        let monaco = await Monaco.current;
        language = language.toLowerCase().trim();

        if (!this.intellisense.contains(language)) {
            return;
        }

        let languageCollection = this.intellisense.get(language);
        let instance = languageCollection.get(filePath);
        if (instance == null) {
            return;
        }

        instance.dispose();
        return languageCollection.remove(filePath);
    }
}
