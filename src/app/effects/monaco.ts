import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities, Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes, MonacoService } from '../services';
import * as _ from 'lodash';
import { Action } from '@ngrx/store';
import { UI, Monaco } from '../actions';
import { Effect, Actions } from '@ngrx/effects';


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
export class MonacoEffects {
    private _cache: Storage<string>;
    private _current: Dictionary<IDisposableFile>;

    constructor(
        private actions$: Actions,
        private _request: Request
    ) {
        this._cache = new Storage<string>('IntellisenseCache', StorageType.SessionStorage);
        this._current = new Dictionary<IDisposableFile>();
    }

    @Effect()
    updateIntellisense$: Observable<Action> = this.actions$
        .ofType(Monaco.MonacoActionTypes.ADD_INTELLISENSE)
        .map((action: Monaco.AddIntellisenseAction) => ({ payload: action.payload, language: action.language }))
        .mergeMap(({ payload, language }) => this._parseAndUpdate(payload, language))
        .filter(data => data !== null)
        .map(data => new Monaco.UpdateIntellisenseSuccessAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to update intellisense', exception)));

    @Effect()
    clearUnusedIntellisense$: Observable<Action> = this.actions$
        .ofType(Monaco.MonacoActionTypes.UPDATE_INTELLISENSE)
        .map((action: Monaco.UpdateIntellisenseAction) => ({ payload: action.payload, language: action.language }))
        .map(({payload, language}) => {
            this._current.values().forEach(file => {
                if (!file.retain) {
                    console.info(file);
                    file.disposable.dispose();
                    this._current.remove(file.url);
                }
                else {
                    file.retain = false;
                }
            });

            return new Monaco.AddIntellisenseAction(payload, language);
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to clear intellisense', exception)));

    private _parseAndUpdate(libraries: string[], language: string) {
        return Observable
            .fromPromise(MonacoService.current)
            .mergeMap((monaco, index) => {
                let source = this._determineSource(language);

                return this._parse(libraries)
                    .filter(url => url && url.trim() !== '')
                    .mergeMap(url => this._get(url))
                    .filter(file => !(file == null))
                    .map(file => {
                        let intellisense = this._current.get(file.url);
                        if (intellisense == null) {
                            let disposable = source.addExtraLib(file.content, file.url);
                            intellisense = this._current.add(file.url, { url: file.url, disposable, retain: true });
                        }
                        else {
                            intellisense.retain = true;
                        }

                        return file.url;
                    });
            });
    }

    private _parse(libraries: string[]) {
        return Observable.from(libraries)
            .map(library => {
                if (/^@types/.test(library)) {
                    return `https://unpkg.com/${library}/index.d.ts`;
                }
                else if (/^dt~/.test(library)) {
                    let libName = library.split('dt~')[1];
                    return `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/${libName}/index.d.ts`;
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

    private _get(url: string): Observable<IIntellisenseFile> {
        if (this._cache.contains(url)) {
            let content = this._cache.get(url);
            console.info(`Loading from cache: ${url}`);
            return Observable.of({ url, content });
        }
        else {
            return this._request.get<string>(url, null, ResponseTypes.TEXT)
                .map(content => this._cache.insert(url, content))
                .map(content => ({ content, url }));
        }
    }

    private _determineSource(language: string) {
        switch (language) {
            case 'javascript': return monaco.languages.typescript.javascriptDefaults;
            default: return monaco.languages.typescript.typescriptDefaults;
        }
    }
}
