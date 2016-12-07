import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities, Dictionary, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Request, ResponseTypes, MonacoService } from '../services';
import * as _ from 'lodash';
import { Action } from '@ngrx/store';
import * as Monaco from '../actions/monaco';
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
        .ofType(Monaco.MonacoActionTypes.UPDATE_INTELLISENSE)
        .map((action: Monaco.UpdateIntellisenseAction) => Observable.from(action.payload))
        .mergeMap(libraries => this._parseAndUpdate(libraries))
        .map(data => {
            console.log(data);
            return new Monaco.UpdateIntellisenseSuccessAction(data as any);
        });

    private async _parseAndUpdate(libraries: Observable<string>, isJavaScript = false) {
        let monaco = await MonacoService.current;
        let source = isJavaScript ?
            monaco.languages.typescript.javascriptDefaults :
            monaco.languages.typescript.typescriptDefaults;

        return this._parse(libraries)
            .filter(url => url && url.trim() !== '')
            .flatMap<IIntellisenseFile>((url: string) => this._get(url))
            .map(file => {
                let intellisense = this._current.get(file.url);
                if (intellisense!) {
                    let disposable = source.addExtraLib(file.content, file.url);
                    intellisense = this._current.add(file.url, { url: file.url, disposable, retain: true });
                }
                else {
                    intellisense.retain = true;
                }

                return file.url;
            });

        // return new Observable(observer => {
        //     let subscription = typings.subscribe(
        //         url => console.info(`Added: ${url}`),
        //         error => {
        //             Utilities.log(error);
        //             observer.error(error);
        //         },
        //         () => {
        //             this._current.values().forEach(file => {
        //                 if (!file.retain) {
        //                     console.info(`Removed: ${file.url}`);
        //                     file.disposable.dispose();
        //                     this._current.remove(file.url);
        //                 }
        //                 else {
        //                     file.retain = false;
        //                 }
        //             });

        //             observer.next(this._current.values());
        //         });

        //     return () => {
        //         if (!subscription.closed) {
        //             subscription.unsubscribe();
        //         }
        //     };
        // });
    }

    private _parse(libraries: Observable<string>) {
        return libraries.map(library => {
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
        })
            .catch(error => {
                Utilities.log(error);
                return '';
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
}
