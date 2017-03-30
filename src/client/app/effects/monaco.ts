import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Dictionary } from '@microsoft/office-js-helpers';
import { AI, Strings, storage } from '../helpers';
import { Request, ResponseTypes, MonacoService } from '../services';
import { Action } from '@ngrx/store';
import { UI, Monaco } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as sha1 from 'crypto-js/sha1';

export interface IIntellisenseFile {
    url: string;
    content: string;
};

export interface IDisposableFile {
    url: string;
    disposable: monaco.IDisposable;
    keep?: boolean;
}

@Injectable()
export class MonacoEffects {
    private _current: Dictionary<IDisposableFile>;

    constructor(
        private actions$: Actions,
        private _request: Request
    ) {
        this._current = new Dictionary<IDisposableFile>();
    }

    @Effect()
    updateIntellisense$: Observable<Action> = this.actions$
        .ofType(Monaco.MonacoActionTypes.UPDATE_INTELLISENSE)
        .map((action: Monaco.UpdateIntellisenseAction) => ({ payload: action.payload, language: action.language }))
        .map(({ payload, language }) => {
            let filesToAdd = this._parse(payload)
                .filter(url => url && url.trim() !== '')
                .map(file => {
                    let currentFile = this._current.get(file);
                    return currentFile == null ? file : currentFile.keep = true;
                })
                .filter(file => file !== true && !(file == null));

            this._current.values()
                .filter(file => !file.keep)
                .map(unusedFile => {
                    unusedFile.disposable.dispose();
                    this._current.remove(unusedFile.url);
                });

            return { files: filesToAdd as string[], language };
        })
        .mergeMap(({ files, language }) => Observable.from(files).map(file => new Monaco.AddIntellisenseAction(file, language)))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.intellisenseUpdateError, exception)));

    @Effect()
    addIntellisense$: Observable<Action> = this.actions$
        .ofType(Monaco.MonacoActionTypes.ADD_INTELLISENSE)
        .mergeMap((action: Monaco.AddIntellisenseAction) => this._addIntellisense(action.payload, action.language))
        .map(() => new Monaco.UpdateIntellisenseSuccessAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.intellisenseClearError, exception)));


    private _addIntellisense(url: string, language: string) {
        let source = this._determineSource(language);
        return Observable
            .fromPromise(MonacoService.current)
            .mergeMap(() => this._get(url))
            .map(file => {
                AI.trackEvent(Monaco.MonacoActionTypes.ADD_INTELLISENSE, { library: sha1(file.url).toString() });
                let disposable = source.addExtraLib(file.content, file.url);
                let intellisense = this._current.add(file.url, { url: file.url, disposable, keep: false });
                return intellisense;
            })
            .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.intellisenseLoadError, exception)));
    }

    private _parse(libraries: string[]) {
        return libraries.map(library => {
            if (/^@types/.test(library)) {
                return `https://unpkg.com/${library}/index.d.ts`;
            }
            else if (/^dt~/.test(library)) {
                let libName = library.split('dt~')[1];
                return `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`;
            }
            else if (/\.d\.ts$/i.test(library)) {
                if (/^https?:/i.test(library)) {
                    return library;
                }
                else {
                    return `https://unpkg.com/${library}`;
                }
            }
            else {
                return null;
            }
        });
    }

    private _get(url: string): Observable<IIntellisenseFile> {
        if (storage.intellisenseCache.contains(url)) {
            let content = storage.intellisenseCache.get(url);
            return Observable.of({ url, content });
        }
        else {
            return this._request.get<string>(url, null, ResponseTypes.TEXT)
                .map(content => storage.intellisenseCache.insert(url, content))
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
