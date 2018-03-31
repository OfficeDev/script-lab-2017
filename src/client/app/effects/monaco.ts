import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Dictionary } from '@microsoft/office-js-helpers';
import { AI, storage, environment } from '../helpers';
import { Strings } from '../strings';
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
        .map((action: Monaco.UpdateIntellisenseAction) => action.payload)
        .map(({ libraries, language }) => {
            let additionalLibraries = [];

            additionalLibraries.push(`${location.origin}/libs/auth-helpers.d.ts`);
            additionalLibraries.push(`${location.origin}/libs/maker.d.ts`);

            let urlsToInclude = this._parse(libraries)
                .concat(additionalLibraries)
                .filter(url => url && url.trim() !== '');

            let urlsStillInNeedOfFetching: string[] = [];

            urlsToInclude
                .forEach(file => {
                    let currentFile = this._current.get(file);
                    if (!currentFile) {
                        urlsStillInNeedOfFetching.push(file);
                    }
                });

            let filesThatCanBeDisposed: IDisposableFile[] = this._current.values();
            filesThatCanBeDisposed
                .filter(file => urlsToInclude.indexOf(file.url) < 0)
                .map(unusedFile => {
                    unusedFile.disposable.dispose();
                    this._current.remove(unusedFile.url);
                });

            return { files: urlsToInclude as string[], language };
        })
        .mergeMap(({ files, language }) => Observable.from(files).map(file => new Monaco.AddIntellisenseAction({ url: file, language })))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().intellisenseUpdateError, exception)));

    @Effect()
    addIntellisense$: Observable<Action> = this.actions$
        .ofType(Monaco.MonacoActionTypes.ADD_INTELLISENSE)
        .mergeMap((action: Monaco.AddIntellisenseAction) => this._addIntellisense(action.payload))
        .map(() => new Monaco.UpdateIntellisenseSuccessAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().intellisenseClearError, exception)));


    private _addIntellisense(payload: { url: string; language: string; }) {
        let { url, language } = payload;
        let source = this._determineSource(language);
        return Observable
            .fromPromise(MonacoService.current)
            .mergeMap(() => this._get(url))
            .map(file => {
                AI.trackEvent(Monaco.MonacoActionTypes.ADD_INTELLISENSE, { library: sha1(file.url).toString() });
                let disposable = source.addExtraLib(file.content, file.url);
                let intellisense = this._current.add(file.url, { url: file.url, disposable });
                return intellisense;
            })
            .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().intellisenseLoadError, exception)));
    }

    private _parse(libraries: string[]) {
        return libraries.map(library => {
            library = library.trim();

            if (/^@types/.test(library)) {
                return `https://unpkg.com/${library}/index.d.ts`;

            }
            else if (/^dt~/.test(library)) {
                let libName = library.split('dt~')[1];
                return `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`;

            }
            else if (/\.d\.ts$/i.test(library)) {
                // For custom functions, don't use the stock Office.js library. Exclude it
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
            return this._request.get<string>(url, ResponseTypes.TEXT, null, environment.current.runtimeSessionTimestamp)
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
