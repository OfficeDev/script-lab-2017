import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import { PlaygroundError, AI, post, environment, isInsideOfficeApp, storage,
    SnippetFieldType, getScrubbedSnippet, getSnippetDefaults } from '../helpers';
import { Strings, getDisplayLanguage } from '../strings';
import { Request, ResponseTypes, GitHubService } from '../services';
import { UIEffects } from './ui';
import { Action } from '@ngrx/store';
import { Snippet, UI } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as cuid from 'cuid';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { isEmpty, isNil, find, assign, reduce, forIn, isEqual } from 'lodash';

@Injectable()
export class SnippetEffects {
    constructor(
        private actions$: Actions,
        private _request: Request,
        private _github: GitHubService,
        private _uiEffects: UIEffects,
        reduxStore: Store<fromRoot.State>,
    ) { }

    @Effect()
    import$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.IMPORT)
        .map(action => ({ data: action.payload, mode: action.mode }))
        .mergeMap(({ data, mode }) => {
            return this._importRawFromSource(data, mode)
                .map((snippet: ISnippet) => ({ snippet, mode }))
                .filter(({ snippet }) => !(snippet == null))
                .mergeMap(({ snippet, mode }) => this._massageSnippet(snippet, mode))
                .catch((exception: Error) => {
                    const message = (exception instanceof PlaygroundError) ? exception.message : Strings().snippetImportErrorBody;
                    this._uiEffects.alert(
                        message,
                        Strings().snippetImportErrorTitle,
                        Strings().okButtonLabel);
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
            scrubbedSnippet.modified_at = Date.now();
            storage.snippets.insert(scrubbedSnippet.id, scrubbedSnippet);
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
    run$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.RUN)
        .map(action => action.payload)
        .map((snippet: ISnippet) => {
            const state: IRunnerState = {
                snippet: snippet,
                returnUrl: window.location.href,
                displayLanguage: getDisplayLanguage()
            };
            const data = JSON.stringify(state);

            AI.trackEvent('[Runner] Running Snippet', { snippet: snippet.id });
            post(environment.current.config.runnerUrl + '/compile/page', { data });
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
        .map(( { payload } ) => {
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

    private _exists(name: string) {
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
                return Observable.of(storage.snippets.get(data));

            /* If import type is URL or SAMPLE, then just load it assuming to be YAML */
            case Snippet.ImportType.SAMPLE:
            case Snippet.ImportType.URL:
            case Snippet.ImportType.GIST:
                let id = null;

                const match = /https:\/\/gist.github.com\/(?:.*?\/|.*?)([a-z0-9]{32})$/.exec(data);

                if (match != null) {
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

            /* If import type is YAML, then simply load */
            case Snippet.ImportType.YAML:
                let snippet = jsyaml.load(data);
                return Observable.of(snippet);

            default: return Observable.of(null);
        }
    }

    private _massageSnippet(rawSnippet: ISnippet, mode: string): Observable<Action> {
        if (rawSnippet.host && rawSnippet.host !== environment.current.host) {
            throw new PlaygroundError(`Cannot import a snippet created for ${rawSnippet.host} in ${environment.current.host}.`);
        }

        this._checkForUnsupportedAPIsIfRelevant(rawSnippet.api_set);
        // Note that need to do the unsupported-api check before anything else, and before scrubbing --
        // because api_set will get erased as part of scrubbing (it's only for pre-import and export)

        const scrubbedIfNeeded =
            (mode === Snippet.ImportType.OPEN) ?
                {...rawSnippet} :
                getScrubbedSnippet({...rawSnippet}, SnippetFieldType.PUBLIC);

        const snippet = {} as ISnippet;
        assign(snippet, getSnippetDefaults(), scrubbedIfNeeded);

        if (mode === Snippet.ImportType.DEFAULT) {
            snippet.description = '';
        }

        snippet.id = snippet.id === '' ? cuid() : snippet.id;
        snippet.gist = rawSnippet.gist;
        snippet.gistOwnerId = rawSnippet.gistOwnerId;

        /**
         * If the action here involves true importing rather than re-opening,
         * and if the name is already taken by a local snippet, generate a new name.
         */
        if (mode !== Snippet.ImportType.OPEN && this._exists(snippet.name)) {
            snippet.name = this._generateName(snippet.name, '');
        }

        const actions: Action[] = [
            new Snippet.ImportSuccessAction(snippet)
        ];

        /*
         * If a imported snippet is a SAMPLE, then skip the save (simply to avoid clutter).
         * The snippet will get saved as soon as the user makes any changes.
         */
        if (mode !== Snippet.ImportType.SAMPLE) {
            actions.push(new Snippet.SaveAction(snippet));
        }

        return Observable.from(actions);
    }

    private _checkForUnsupportedAPIsIfRelevant(api_set: { [index: string]: number }) {
        let unsupportedApiSet: { api: string, version: number } = null;
        if (api_set == null) {
            return;
        }

        // On the web, there is no "Office.context.requirements". So skip it.
        if (!isInsideOfficeApp()) {
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
            throw new PlaygroundError(`${environment.current.host} does not support the required API Set ${unsupportedApiSet.api} @ ${unsupportedApiSet.version}.`);
        }
    }
}
