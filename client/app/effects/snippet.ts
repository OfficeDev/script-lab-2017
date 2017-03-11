import { Injectable } from '@angular/core';
import { Storage, HostType } from '@microsoft/office-js-helpers';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import { PlaygroundError, AI, post, Strings, environment } from '../helpers';
import { Request, ResponseTypes, GitHubService } from '../services';
import { Action } from '@ngrx/store';
import { GitHub, Snippet, UI } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as cuid from 'cuid';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { isEmpty, find, assign, reduce, forIn } from 'lodash';

@Injectable()
export class SnippetEffects {
    private _store = new Storage<ISnippet>(`playground_${environment.current.host}_snippets`);

    private _defaults = <ISnippet>{
        id: '',
        gist: '',
        host: environment.current.host,
        api_set: {},
        platform: environment.current.platform,
        created_at: Date.now(),
        modified_at: Date.now(),
        origin: environment.current.config.editorUrl,
        author: '',
        name: Strings.defaultSnippetTitle, // UI unknown
        description: '',
        script: { content: '', language: 'typescript' },
        style: { content: '', language: 'css' },
        template: { content: '', language: 'html' },
        libraries: ''
    };

    constructor(
        private actions$: Actions,
        private _request: Request,
        private _github: GitHubService,
        reduxStore: Store<fromRoot.State>,
    ) {
        this._defaults.author = this._github.profile ? this._github.profile.login : '';
    }

    @Effect({ dispatch: false })
    loggedIn$: Observable<Action> = this.actions$
        .ofType(GitHub.GitHubActionTypes.LOGGED_IN)
        .do(() => this._defaults.author = this._github.profile ? this._github.profile.login : '');

    @Effect()
    import$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.IMPORT)
        .map((action: Snippet.ImportAction) => ({ data: action.payload, suffix: action.params }))
        .mergeMap(({ data, suffix }) => {
            let observable: Observable<ISnippet>;
            let importType = this._determineImportType(data);
            let info = '';

            switch (importType) {
                case 'DEFAULT':
                    info = environment.current.host;
                    if (environment.cache.contains('default_template')) {
                        observable = Observable.of(environment.cache.get('default_template'));
                    }
                    else {
                        observable = this._request
                            .get<string>(`${environment.current.config.samplesUrl}/samples/${environment.current.host.toLowerCase()}/default.yaml`, ResponseTypes.YAML)
                            .map(snippet => environment.cache.insert('default_template', snippet));
                    }
                    break;

                case 'CUID':
                    info = data;
                    observable = Observable.of(this._store.get(data));
                    break;

                case 'GIST':
                    data = data.replace(/https:\/\/gist.github.com\/.*?\//, '');
                    observable = this._github.gist(data)
                        .map(gist => {
                            let snippet = find(gist.files, (value, key) => value ? /\.ya?ml$/gi.test(key) : false);
                            if (gist.public) {
                                info = gist.id;
                            }
                            if (snippet == null) {
                                let output = this._upgrade(gist.files);
                                output.description = '';
                                output.author = '';
                                output.gist = data;
                                return output;
                            }
                            else {
                                return jsyaml.load(snippet.content);
                            }
                        });
                    break;

                case 'URL':
                    observable = this._request.get<ISnippet>(data, ResponseTypes.YAML);
                    break;

                case 'YAML':
                    let snippet = jsyaml.load(data);
                    info = snippet.id;
                    observable = Observable.of(snippet);
                    break;

                default: return null;
            }

            AI.trackEvent(Snippet.SnippetActionTypes.IMPORT, { type: importType, info: info });

            return observable
                .filter(snippet => !(snippet == null))
                .map(snippet => {
                    if (snippet.host && snippet.host !== environment.current.host) {
                        throw new PlaygroundError(`Cannot import a snippet created for ${snippet.host} in ${environment.current.host}.`);
                    }

                    if (snippet.api_set == null || environment.current.host === HostType.WEB) {
                        return snippet;
                    }

                    let unsupportedApiSet: { api: string, version: number } = null;
                    find(snippet.api_set, (version, api) => {
                        if (Office.context.requirements.isSetSupported(api, version)) {
                            return false;
                        }
                        else {
                            unsupportedApiSet = { api, version };
                            return true;
                        }
                    });

                    if (unsupportedApiSet) {
                        throw new PlaygroundError(`${snippet.host} does not support the required API Set ${unsupportedApiSet.api} @ ${unsupportedApiSet.version}.`);
                    }

                    return snippet;
                })
                .map(snippet => assign({}, this._defaults, snippet, <ISnippet>{
                    host: environment.current.host,
                    platform: environment.current.platform,
                    modified_at: Date.now(),
                    origin: environment.current.config.editorUrl,
                }))
                .map(snippet => {
                    let local = importType === 'CUID';
                    if (!local) {
                        snippet.id = '';
                    }
                    if (snippet.id === '') {
                        snippet.id = cuid();
                    }
                    if (this._exists(snippet.name)) {
                        snippet.name = this._generateName(snippet.name, suffix);
                    }
                    return new Snippet.ImportSuccessAction(snippet);
                });
        })
        .catch(exception => Observable.from([
            new UI.ReportErrorAction(Strings.snippetImportError, exception),
            new UI.ShowAlertAction({ message: Strings.snippetImportErrorBody, title: Strings.snippetImportErrorTitle, actions: [Strings.okButtonLabel] })
        ]));

    @Effect()
    save$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.SAVE, Snippet.SnippetActionTypes.CREATE)
        .map((action: Snippet.SaveAction) => action.payload)
        .map(snippet => {
            this._validate(snippet);
            snippet.modified_at = new Date().getTime();

            if (this._store.contains(snippet.id)) {
                this._store.insert(snippet.id, snippet);
            }
            else {
                this._store.add(snippet.id, snippet);
            }

            return new Snippet.StoreUpdatedAction();
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetSaveError, exception)));

    @Effect()
    duplicate$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DUPLICATE)
        .map((action: Snippet.DuplicateAction) => action.payload)
        .map(id => {
            let orignial = this._store.get(id);
            let copy: ISnippet = assign({}, this._defaults, orignial);
            copy.id = cuid();
            copy.name = this._generateName(copy.name, 'copy');
            return new Snippet.ImportSuccessAction(copy);
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetDupeError, exception)));

    @Effect()
    delete$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE)
        .map((action: Snippet.DeleteAction) => action.payload)
        .map(id => this._store.remove(id))
        .mergeMap(() => Observable.from([
            new Snippet.StoreUpdatedAction(),
            new UI.ToggleImportAction(true)
        ]))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetDeleteError, exception)));

    @Effect()
    deleteAll$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE_ALL)
        .map(() => this._store.clear())
        .map(() => new Snippet.StoreUpdatedAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetDeleteAllError, exception)));

    @Effect()
    loadSnippets$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.STORE_UPDATED, Snippet.SnippetActionTypes.LOAD_SNIPPETS)
        .map(() => new Snippet.LoadSnippetsSuccessAction(this._store.values()))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetLoadAllError, exception)));

    @Effect({ dispatch: false })
    run$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.RUN)
        .map(action => action.payload)
        .map((snippet: ISnippet) => {
            let data = JSON.stringify({
                snippet: snippet
            });

            post(environment.current.config.runnerUrl + '/compile', { data });
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetRunError, exception)));

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
        .map(data => new Snippet.LoadTemplatesSuccessAction(data))
        .catch(exception => Observable.of(new UI.ReportErrorAction(Strings.snippetLoadDefaultsError, exception)));

    private _determineImportType(data: string): 'DEFAULT' | 'CUID' | 'URL' | 'GIST' | 'YAML' | null {
        if (data == null) {
            return null;
        }

        if (/^https:\/\/gist.github.com/.test(data)) {
            return 'GIST';
        }

        if (/^https?/.test(data)) {
            return 'URL';
        }

        if (data === 'default') {
            return 'DEFAULT';
        }

        if (data.length === 25) {
            return 'CUID';
        }

        if (data.length === 32) {
            return 'GIST';
        }

        return 'YAML';
    }

    private _exists(name: string) {
        return this._store.values().some(item => item.name.trim() === name.trim());
    }

    private _validate(snippet: ISnippet) {
        if (isEmpty(snippet)) {
            throw new PlaygroundError(Strings.snippetValidationEmpty);
        }

        if (isEmpty(snippet.name)) {
            throw new PlaygroundError(Strings.snippetValidationNoTitle);
        }
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = isEmpty(name.trim()) ? Strings.newSnippetTitle : name.trim();
        let regex = new RegExp(`^${name}`);
        let collisions = this._store.values().filter(item => regex.test(item.name.trim()));
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
        let snippet = { ...this._defaults } as ISnippet;
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

        AI.trackEvent('Upgrading snippet', { upgradeFrom: 'preview', upgradeTo: JSON.stringify(environment.current.build) });
        return snippet;
    }
}
