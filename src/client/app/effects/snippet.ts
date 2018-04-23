import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import {
    PlaygroundError, AI, post, environment, isInsideOfficeApp, storage, processLibraries,
    SnippetFieldType, getScrubbedSnippet, getSnippetDefaults, trustedSnippetManager, ensureFreshLocalStorage, isMakerScript
} from '../helpers';
import { Strings, getDisplayLanguage } from '../strings';
import { Request, ResponseTypes, GitHubService } from '../services';
import { UIEffects } from './ui';
import { Action } from '@ngrx/store';
import { Snippet, UI } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as cuid from 'cuid';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { isEmpty, isNil, find, assign, reduce, forIn, isEqual, pick } from 'lodash';
import * as sha1 from 'crypto-js/sha1';
import { Utilities, HostType } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

@Injectable()
export class SnippetEffects {
    constructor(
        private actions$: Actions,
        private _request: Request,
        private _github: GitHubService,
        private _uiEffects: UIEffects,
        private _store: Store<fromRoot.State>,
    ) { }

    @Effect()
    import$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.IMPORT)
        .map(action => ({
            data: action.payload.data,
            mode: action.payload.mode,
            isReadOnlyViewMode: action.payload.isReadOnlyViewMode,
            saveToLocalStorage: action.payload.saveToLocalStorage,
            onSuccess: action.payload.onSuccess
        }))
        .mergeMap(({ data, mode, isReadOnlyViewMode, saveToLocalStorage, onSuccess }) => {
            let resultingSnippet: ISnippet;

            return this._importRawFromSource(data, mode)
                .filter((snippet) => !isNil(snippet))
                .mergeMap(async (snippet) => {
                    let result = await this._massageSnippet(snippet, mode, { isReadOnlyViewMode, saveToLocalStorage });
                    resultingSnippet = result.snippet;
                    return result.actions;
                })
                .mergeMap(actions => {
                    if (onSuccess) {
                        onSuccess(resultingSnippet);
                    }

                    return actions; /* resolves the Promise */
                })
                .catch((exception: Error) => {
                    if (isReadOnlyViewMode) {
                        location.hash = '/view/error';
                    } else {
                        const message = (exception instanceof PlaygroundError) ? exception.message : Strings().snippetImportErrorBody;
                        this._uiEffects.alert(
                            message,
                            Strings().snippetImportErrorTitle,
                            Strings().ok);
                    }
                    return Observable.from([]);
                });
        });

    @Effect()
    save$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.SAVE, Snippet.SnippetActionTypes.CREATE)
        .map((action: Snippet.SaveAction) => action.payload)
        .map(rawSnippet => {
            this._validate(rawSnippet);

            const publicOrInternal = SnippetFieldType.PUBLIC | SnippetFieldType.INTERNAL;
            const scrubbedSnippet = getScrubbedSnippet(rawSnippet, publicOrInternal);
            delete scrubbedSnippet.modified_at;

            // Bug #593, stopgap fix until more performant solution is implemented
            ensureFreshLocalStorage();
            storage.snippets.load();
            if (storage.snippets.contains(scrubbedSnippet.id)) {
                const originalRawSnippet = storage.snippets.get(scrubbedSnippet.id);
                const originalScrubbedSnippet = getScrubbedSnippet(originalRawSnippet, publicOrInternal);
                delete originalScrubbedSnippet.modified_at;

                if (isEqual(scrubbedSnippet, originalScrubbedSnippet)) {
                    return null;
                }
            }
            return scrubbedSnippet;
        })
        .filter(snippet => snippet != null)
        .map(scrubbedSnippet => {
            // note: removed the use of storage.snippets.insert as there was a bug where it wasn't writing to local storage in IE
            const hostStorageKey = localStorageKeys.hostSnippets_parameterized
                .replace('{0}', environment.current.host);

            // update snippets.  Note that we'll both update through the "official"
            //    channel of "storage.snippets", and also update the localStorage directly
            //    (otherwise, heartbeat refresh was not working)
            storage.snippets.insert(scrubbedSnippet.id, scrubbedSnippet);

            scrubbedSnippet.modified_at = Date.now();
            const snippets = JSON.parse(window.localStorage.getItem(hostStorageKey)) || {};
            snippets[scrubbedSnippet.id] = scrubbedSnippet;
            window.localStorage.setItem(hostStorageKey, JSON.stringify(snippets));

            // update lastOpened
            const settings = JSON.parse(window.localStorage.getItem(localStorageKeys.settings)) || {};
            settings[environment.current.host].lastOpened = pick(scrubbedSnippet, ['created_at', 'host', 'id', 'libraries', 'modified_at', 'name', 'description']);

            window.localStorage.setItem(localStorageKeys.settings, JSON.stringify(settings));

            return new Snippet.StoreUpdatedAction();
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetSaveError, exception)));

    @Effect()
    duplicate$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DUPLICATE)
        .map((action: Snippet.DuplicateAction) => action.payload)
        .map(id => {
            const original = getScrubbedSnippet(storage.snippets.get(id), SnippetFieldType.PUBLIC);
            const copy: ISnippet = {} as any;
            assign(copy, getSnippetDefaults(), original);
            copy.id = cuid();
            copy.name = this._generateName(copy.name, 'copy');
            return new Snippet.ImportSuccessAction(copy);
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetDupeError, exception)));

    @Effect()
    delete$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE)
        .map((action: Snippet.DeleteAction) => action.payload)
        .map(id => storage.snippets.remove(id))
        .mergeMap(() => Observable.from([
            new Snippet.StoreUpdatedAction(),
            new UI.ToggleImportAction(true)
        ]))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetDeleteError, exception)));

    @Effect()
    deleteAll$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE_ALL)
        .map(() => storage.snippets.clear())
        .map(() => new Snippet.StoreUpdatedAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetDeleteAllError, exception)));

    @Effect()
    loadSnippets$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.STORE_UPDATED, Snippet.SnippetActionTypes.LOAD_SNIPPETS)
        .map(() => new Snippet.LoadSnippetsSuccessAction(storage.snippets.values()))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetLoadAllError, exception)));

    @Effect({ dispatch: false })
    run$: Observable<Action | void> = this.actions$
        .ofType(Snippet.SnippetActionTypes.RUN)
        .map(action => action.payload)
        .map((snippet: ISnippet) => {
            if (Utilities.host === HostType.OUTLOOK) {
                this._store.dispatch(new UI.ShowAlertAction({
                    actions: [Strings().ok],
                    title: Strings().snippetRunError,
                    message: Strings().noRunInOutlook
                }));
                this._store.dispatch(new Snippet.CancelRunAction());
            } else {
                const state: IRunnerState = {
                    snippet: snippet,
                    displayLanguage: getDisplayLanguage(),
                    isInsideOfficeApp: isInsideOfficeApp(),
                };
                const data = JSON.stringify(state);
                const isTrustedSnippet = trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId);

                AI.trackEvent('[Runner] Running Snippet', { snippet: snippet.id });
                post(environment.current.config.runnerUrl + '/compile/page', { data, isTrustedSnippet });
            }
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetRunError, exception)));

    @Effect()
    loadTemplates$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.LOAD_TEMPLATES)
        .map((action: Snippet.LoadTemplatesAction) => action.payload)
        .mergeMap(source => {
            if (source === 'LOCAL') {
                let snippetJsonUrl = `${environment.current.config.samplesUrl}/playlists/${environment.current.host.toLowerCase()}.yaml`;
                return this._request.get<ITemplate[]>(snippetJsonUrl, ResponseTypes.YAML);
            }
            else {
                return this._request.get<ITemplate[]>(source, ResponseTypes.JSON);
            }
        })
        .map(data => {
            return new Snippet.LoadTemplatesSuccessAction(data);
        })
        .catch(exception => {
            console.log(Strings().snippetLoadDefaultsError, exception);
            return Observable.of(new Snippet.LoadTemplatesSuccessAction([]));
        });

    @Effect()
    updateInfo$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.UPDATE_INFO)
        .map(({ payload }) => {
            let { id, name, description, gist, gistOwnerId } = payload;
            let snippet: ISnippet = storage.lastOpened;
            if (storage.snippets.contains(id)) {
                snippet = storage.snippets.get(id);

                /* check if fields are undefined or null */
                if (!isNil(name)) {
                    snippet.name = name;
                }
                if (!isNil(description)) {
                    snippet.description = description;
                }
                if (!isNil(gist)) {
                    snippet.gist = gist;
                }
                if (!isNil(gistOwnerId)) {
                    snippet.gistOwnerId = gistOwnerId;
                }

                /* updates snippet */
                storage.snippets.insert(id, snippet);
            }

            return snippet;
        })
        .map((updatedSnippet) => new Snippet.SaveAction(updatedSnippet))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings().snippetUpdateError, exception)));

    @Effect({ dispatch: false })
    openInPlayground$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.OPEN_IN_PLAYGROUND)
        .map(action => action.payload)
        .map(payload => {
            let { type, id, isDownload } = payload;
            let handler, extension;
            let correlationId = cuid();
            switch (environment.current.host.toUpperCase()) {
                case HostType.EXCEL:
                    handler = 'ms-excel:ofe|u|';
                    extension = '.xlsx';
                    break;
                case HostType.WORD:
                    handler = 'ms-word:ofe|u|';
                    extension = '.docx';
                    break;
                case HostType.POWERPOINT:
                    handler = 'ms-powerpoint:ofe|u|';
                    extension = '.pptx';
                    break;
                default:
                    throw new Error(`Unsupported host: ${environment.current.host}`);
            }
            AI.trackEvent('Open in playground initiated', { id: correlationId });
            let filename = `script-lab-playground-${environment.current.host}${extension}`;
            let url = `${environment.current.config.runnerUrl}/open/${environment.current.host}/${type}/${id}/${filename}?correlationId=${correlationId}`;
            if (isDownload) {
                window.open(url, '_blank');
            } else {
                window.location.href = `${handler}${url}`;
            }
        })
        .catch(exception => {
            AI.trackException(Strings().snippetOpenInPlaygroundError, exception);
            return Observable.from([]);
        });

    private _getSnippetsWithMatchingGistID(id: string): ISnippet[] {
        return storage.snippets.values().filter(item => item.gist && item.gist.trim() === id.trim());
    }

    private _nameExists(name: string) {
        return storage.snippets.values().some(item => item.name.trim() === name.trim());
    }

    private _validate(snippet: ISnippet) {
        if (isEmpty(snippet)) {
            throw new PlaygroundError(Strings().snippetValidationEmpty);
        }

        if (isNil(snippet.name)) {
            throw new PlaygroundError(Strings().snippetValidationNoTitle);
        }
    }

    /**
     * If the action here involves true importing rather than re-opening,
     * and if the name is already taken by a local snippet, generate a new name.
     */
    private _updateSnippetNameIfNeeded(snippet: ISnippet, mode: string, isReadOnlyViewMode: boolean) {
        if (mode === Snippet.ImportType.OPEN) {
            return;
        }

        if (isReadOnlyViewMode) {
            // Also do nothing, no need to rename something that isn't saving or able to be edited
            return;
        }

        if (this._nameExists(snippet.name)) {
            snippet.name = this._generateName(snippet.name, '');
        }
    }

    private _shouldSaveImportedSnippet(mode: string, isReadOnlyViewMode: boolean): boolean {
        // If a imported snippet is a SAMPLE or the app is in view mode, then skip the save
        // (simply to avoid clutter -- the user might be opening a bunch, one after the other).
        // The snippet will get saved as soon as the user makes any changes (if in editor mode).

        if (mode === Snippet.ImportType.SAMPLE) {
            return false;
        }

        if (isReadOnlyViewMode) {
            return false;
        }

        return true;
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = isNil(name.trim()) ? Strings().newSnippetTitle : name.trim();
        let regex = new RegExp(`^${name}`);
        let collisions = storage.snippets.values().filter(item => regex.test(item.name.trim()));
        let maxSuffixNumber = reduce(collisions, (max, item: any) => {
            let match = /\(?(\d+)?\)?$/.exec(item.name.trim());
            if (max <= ~~match[1]) {
                max = ~~match[1] + 1;
            }
            return max;
        }, 1);

        return `${newName}${(suffix ? ' - ' + suffix : '')}${(maxSuffixNumber ? ' - ' + maxSuffixNumber : '')}`;
    }

    private _upgrade(files: IGistFiles) {
        let snippet = { ...getSnippetDefaults() } as ISnippet;
        forIn(files, (file, name) => {
            switch (name) {
                case 'libraries.txt':
                    snippet.libraries = file.content;
                    snippet.libraries = snippet.libraries.replace(/^\/\//gm, 'https://');
                    snippet.libraries = snippet.libraries.replace(/^#/gm, '//');
                    break;

                case 'app.ts':
                    snippet.script.content = file.content;
                    break;

                case 'index.html':
                    snippet.template.content = file.content;
                    break;

                case 'style.css':
                    snippet.style.content = file.content;
                    break;

                default:
                    if (!/\.json$/.test(name)) {
                        break;
                    }
                    snippet.name = JSON.parse(file.content).name;
                    break;
            }
        });

        AI.trackEvent('[Snippet] Upgrading Snippet', { upgradeFrom: 'preview' });
        return snippet;
    }

    /** Does a raw import of the snippet.  A subsequent function, _massageSnippet, will clean up any extraneous fields */
    private _importRawFromSource(data: string, type: string): Observable<ISnippet> {
        AI.trackEvent(type);
        switch (type) {
            /* If creating a new snippet, try to load it from cache */
            case Snippet.ImportType.DEFAULT:
                if (environment.cache.contains('default_template')) {
                    return Observable.of(environment.cache.get('default_template'));
                }
                else {
                    return this._request
                        .get<string>(`${environment.current.config.samplesUrl}/samples/${environment.current.host.toLowerCase()}/default.yaml`, ResponseTypes.YAML)
                        .map(snippet => environment.cache.insert('default_template', snippet));
                }

            /* If importing a local snippet, then load it off the store */
            case Snippet.ImportType.OPEN:
                let snippet = storage.snippets.get(data);
                if (!snippet) {
                    this._uiEffects.alert(
                        Strings().requestedSnippetNoLongerExists,
                        Strings().cannotOpenSnippet,
                        Strings().ok);
                    return Observable.of(null);
                }

                return Observable.of(snippet);

            /* If import type is URL or SAMPLE, then just load it assuming to be YAML */
            case Snippet.ImportType.SAMPLE:
            case Snippet.ImportType.URL_OR_YAML:
            case Snippet.ImportType.GIST:
                // Try YAML first, as the easiest one to isolate.
                try {
                    let snippet = jsyaml.safeLoad(data) as ISnippet;
                    if (snippet && snippet.script && snippet.libraries) {
                        return Observable.of(snippet);
                    }
                } catch (e) {
                    /* Intentionally blank. Must not have been a YAML file...
                        so try as URL or something else instead. */
                }

                let id = null;

                const match = /https:\/\/gist.github.com\/(?:.*?\/|.*?)([a-z0-9]{32})$/.exec(data);

                if (match) {
                    /* If importing a gist, then extract the gist ID and use the apis to retrieve it */
                    id = match[1];
                }
                else {
                    if (data.length === 32 && !(/https?:\/\//.test(data))) {
                        /* The user provided a gist ID and its not a url*/
                        id = data;
                    }
                    else {
                        /* Assume its a regular URL */
                        return this._request.get<ISnippet>(data, ResponseTypes.YAML, true /*force bypass of cache*/);
                    }
                }

                /* use the github api to get the gist, needed for secret gists as well */
                return this._github.gist(id)
                    .map(gist => {
                        /* Try to find a yaml file */
                        let snippet = find(gist.files, (value, key) => value ? /\.ya?ml$/gi.test(key) : false);
                        let output: ISnippet = null;

                        /* Try to upgrade the gist if there was no yaml file in it */
                        if (snippet == null) {
                            output = this._upgrade(gist.files);
                            output.description = '';
                            output.gist = data;
                        }
                        else {
                            output = jsyaml.load(snippet.content);
                            output.gist = gist.id;
                        }

                        output.gistOwnerId = gist.owner.login;

                        return output;
                    });

            default:
                // OK that error is in English, because this is a programmer error,
                // it should not leak to the user:
                this._uiEffects.alert('Invalid import type', 'Internal Error');
                return Observable.of(null);
        }
    }

    private async _massageSnippet(
        rawSnippet: ISnippet,
        mode: string,
        additionalParameters: {
            isReadOnlyViewMode: boolean;
            saveToLocalStorage: boolean;
        }
    ): Promise<{ snippet: ISnippet, actions: Observable<Action> }> {
        if (rawSnippet.host && rawSnippet.host !== environment.current.host) {
            throw new PlaygroundError(Strings().cannotImportSnippetCreatedForDifferentHost(
                rawSnippet.host, environment.current.host));
        }

        this._checkForUnsupportedAPIsIfRelevant(rawSnippet.api_set, rawSnippet);
        // Note that need to do the unsupported-api check before anything else, and before scrubbing --
        // because api_set will get erased as part of scrubbing (it's only for pre-import and export)

        const scrubbedIfNeeded =
            (mode === Snippet.ImportType.OPEN) ?
                { ...rawSnippet } :
                getScrubbedSnippet({ ...rawSnippet }, SnippetFieldType.PUBLIC);

        const snippet = {} as ISnippet;
        assign(snippet, getSnippetDefaults(), scrubbedIfNeeded);

        if (mode === Snippet.ImportType.DEFAULT) {
            snippet.description = '';
        }

        snippet.id = snippet.id === '' ? cuid() : snippet.id;
        snippet.gist = rawSnippet.gist;
        snippet.gistOwnerId = rawSnippet.gistOwnerId;

        let properties = {};
        if (mode === Snippet.ImportType.GIST) {
            properties['hashedGistId'] = sha1(snippet.gist);
        }
        else if (mode === Snippet.ImportType.SAMPLE) {
            properties['sampleName'] = snippet.name;
        }
        properties['isReadOnlyViewMode'] = additionalParameters.isReadOnlyViewMode;
        AI.trackEvent(mode, properties);

        /**
         * If the user is importing a gist that already exists, ask the user if they want
         * to navigate to the existing one or create a new one in their local storage.
         */

        let snippetsWithSameGistId: ISnippet[];
        let importResult: string = null;
        if (mode !== Snippet.ImportType.OPEN && snippet.gist) {
            snippetsWithSameGistId = this._getSnippetsWithMatchingGistID(snippet.gist);
            if (snippetsWithSameGistId.length > 0) {
                let options = [
                    Strings().snippetImportExistingButtonLabel,
                    (snippetsWithSameGistId.length === 1) ? Strings().overwriteExistingButtonLabel : null,
                    Strings().createNewCopyButtonLabel,
                    Strings().cancel /* user options */
                ].filter(item => item !== null);

                importResult = await this._uiEffects.alert(
                    Strings().snippetGistIdDuplicationError,
                    `${Strings().import} ${snippet.name}`,
                    ...options
                );
            }
        }

        let getActionsFunc = (): Action[] => {
            switch (importResult) {
                case Strings().snippetImportExistingButtonLabel: {
                    return [new Snippet.ImportSuccessAction(snippetsWithSameGistId[0])];
                }

                case Strings().overwriteExistingButtonLabel: {
                    snippet.id = snippetsWithSameGistId[0].id;
                    trustedSnippetManager.untrustSnippet(snippet.id);
                    return [
                        new Snippet.ImportSuccessAction(snippet),
                        new Snippet.SaveAction(snippet)
                    ];
                }

                case Strings().cancel: {
                    return [];
                }

                default: {
                    this._updateSnippetNameIfNeeded(snippet, mode, additionalParameters.isReadOnlyViewMode);

                    const actions: Action[] = [new Snippet.ImportSuccessAction(snippet)];

                    if (this._shouldSaveImportedSnippet(mode, additionalParameters.isReadOnlyViewMode)) {
                        actions.push(new Snippet.SaveAction(snippet));
                    }
                    return actions;
                }
            }
        };

        return {
            snippet,
            actions: Observable.from(getActionsFunc())
        };
    }

    private _checkForUnsupportedAPIsIfRelevant(api_set: { [index: string]: number }, snippet: ISnippet) {
        let unsupportedApiSet: { api: string, version: number } = null;
        if (api_set == null) {
            return;
        }

        // On the web, there is no "Office.context.requirements". So skip it.
        if (!isInsideOfficeApp()) {
            return;
        }

        const desiredOfficeJS = processLibraries(snippet.libraries, isMakerScript(snippet.script), isInsideOfficeApp()).officeJS || '';
        if (desiredOfficeJS.toLowerCase().indexOf('https://appsforoffice.microsoft.com/lib/1/hosted/') < 0) {
            // Snippets using production Office.js should be checked for API set support.
            // Snippets using the beta endpoint or an NPM package don't need to.
            return;
        }

        find(api_set, (version, api) => {
            if (Office.context.requirements.isSetSupported(api, version)) {
                return false;
            }
            else {
                unsupportedApiSet = { api, version };
                return true;
            }
        });

        if (unsupportedApiSet) {
            throw new PlaygroundError(Strings().currentHostDoesNotSupportRequiredApiSet(
                environment.current.host, unsupportedApiSet.api, unsupportedApiSet.version.toString()));
        }
    }
}
