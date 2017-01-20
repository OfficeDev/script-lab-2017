import { Injectable } from '@angular/core';
import { Utilities, HostType, Storage } from '@microsoft/office-js-helpers';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import * as PlaygroundHelpers from '../helpers';
import { Request, ResponseTypes, GitHubService } from '../services';
import { Action } from '@ngrx/store';
import { Snippet, UI } from '../actions';
import { Effect, Actions } from '@ngrx/effects';
import * as _ from 'lodash';
import cuid = require('cuid');
import { Environment } from '../../environment';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';

@Injectable()
export class SnippetEffects {
    private _store = new Storage<ISnippet>(`playground_${Utilities.host.toLowerCase()}_snippets`);
    private _defaults = <ISnippet>{
        id: '',
        gist: '',
        source: Utilities.host,
        author: '',
        name: 'New Snippet',
        description: '',
        script: { content: '', language: 'typescript' },
        style: { content: '', language: 'css' },
        template: { content: '', language: 'html' },
        libraries: ''
    };
    private samplesRepoUrl = 'https://raw.githubusercontent.com/WrathOfZombies/samples/deployment';

    constructor(
        private actions$: Actions,
        private _request: Request,
        private _github: GitHubService,
        reduxStore: Store<fromRoot.State>,
    ) {
        this._defaults.author = this._github.profile ? this._github.profile.login : '';
        this._store.notify = (event) => reduxStore.dispatch(new Snippet.LoadSnippetsAction());
    }

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
                    info = Utilities.host.toLowerCase();
                    observable = Observable.of(jsyaml.load(this.getDefaultSnippet()));
                    break;

                case 'CUID':
                    info = data;
                    observable = Observable.of(this._store.get(data));
                    break;

                case 'GIST':
                    data = data.replace(/https:\/\/gist.github.com\/.*?\//, '');
                    observable = this._github.gist(data)
                        .map(gist => {
                            let snippet = _.find(gist.files, (value, key) => /\.ya?ml$/gi.test(key));
                            if (gist.public) {
                                info = gist.id;
                            }
                            if (snippet == null) {
                                let output = this._upgrade(gist.files);
                                output.description = '';
                                output.author = '';
                                output.source = '';
                                output.gist = data;
                                return output;
                            }
                            else {
                                return jsyaml.load(snippet.content);
                            }
                        });
                    break;

                case 'URL':
                    observable = this._request.get<string>(data, ResponseTypes.YAML);
                    break;

                case 'YAML':
                    let snippet = jsyaml.load(data);
                    info = snippet.id;
                    observable = Observable.of(snippet);
                    break;

                default: return;
            }

            PlaygroundHelpers.AI.current.trackEvent(Snippet.SnippetActionTypes.IMPORT, { type: importType, info: info });

            return observable
                .filter(snippet => !(snippet == null))
                .map(snippet => _.assign({}, this._defaults, snippet))
                .mergeMap(snippet => {
                    let external = importType !== 'CUID';
                    if (external) {
                        snippet.id = '';
                    }
                    if (snippet.id === '') {
                        snippet.id = cuid();
                    }

                    if (external && this._exists(snippet.name)) {
                        snippet.name = this._generateName(snippet.name, suffix);
                    }

                    return Observable.from([
                        new Snippet.ImportSuccessAction(snippet, external),
                        new UI.CloseMenuAction(),
                    ]);
                });
        })
        .catch(exception => Observable.from([
            new UI.ReportErrorAction('Failed to import  snippet', exception),
            new UI.CloseMenuAction(),
            new UI.ShowAlertAction({ message: 'We were unable to import the snippet. Please check the GIST ID or URL for correctness.', title: 'Import failed', actions: ['OK'] })
        ]));

    @Effect()
    save$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.SAVE, Snippet.SnippetActionTypes.CREATE)
        .map((action: Snippet.SaveAction) => action.payload)
        .map(snippet => {
            this._validate(snippet);

            if (this._store.contains(snippet.id)) {
                this._store.insert(snippet.id, snippet);
            }
            else {
                this._store.add(snippet.id, snippet);
            }

            return new Snippet.StoreUpdatedAction();
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to save the current snippet', exception)));

    @Effect()
    duplicate$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DUPLICATE)
        .map((action: Snippet.DuplicateAction) => action.payload)
        .map(id => {
            let orignial = this._store.get(id);
            let copy: ISnippet = _.assign({}, this._defaults, orignial);
            copy.id = cuid();
            copy.name = this._generateName(copy.name, 'copy');
            return new Snippet.ImportSuccessAction(copy, true);
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to duplicate the current snippet', exception)));

    @Effect()
    delete$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE)
        .map((action: Snippet.DeleteAction) => action.payload)
        .map(id => this._store.remove(id))
        .mergeMap(() => Observable.from([
            new Snippet.StoreUpdatedAction(),
            new UI.OpenMenuAction()
        ]))
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to delete current snippet', exception)));

    @Effect()
    deleteAll$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.DELETE_ALL)
        .map(action => this._store.clear())
        .map(() => new Snippet.StoreUpdatedAction())
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to delete all local snippets', exception)));

    @Effect()
    loadSnippets$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.STORE_UPDATED, Snippet.SnippetActionTypes.LOAD_SNIPPETS)
        .map(() => new Snippet.LoadSnippetsSuccessAction(this._store.values()))
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to load the local snippets', exception)));

    @Effect({ dispatch: false })
    run$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.RUN)
        .map(action => action.payload)
        .map((snippet: ISnippet) => {
            let url = 'https://addin-playground-runner-staging.azurewebsites.net/';

            let postData: IRunnerPostData = {
                snippet: jsyaml.safeDump(snippet),
                returnUrl: window.location.href,
                refreshUrl: window.location.origin + '/refresh.html',

                // Any further fields will simply get passed in to the refresh page:
                id: snippet.id,
                host: Utilities.host,
                platform: Utilities.platform
            };

            this._post(url, { data: JSON.stringify(postData) });
        })
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to run the snippet', exception)));

    @Effect()
    loadTemplates$: Observable<Action> = this.actions$
        .ofType(Snippet.SnippetActionTypes.LOAD_TEMPLATES)
        .map((action: Snippet.LoadTemplatesAction) => action.payload)
        .mergeMap(source => {
            if (source === 'LOCAL') {
                let snippetJsonUrl = `${this.samplesRepoUrl}/playlists/${Utilities.host.toLowerCase()}.yaml`;
                return this._request.get<ITemplate[]>(snippetJsonUrl, ResponseTypes.YAML);
            }
            else {
                return this._request.get<ITemplate[]>(source, ResponseTypes.JSON);
            }
        })
        .map(data => new Snippet.LoadTemplatesSuccessAction(data))
        .catch(exception => Observable.of(new UI.ReportErrorAction('Failed to load the default samples', exception)));

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
        if (_.isEmpty(snippet)) {
            throw new PlaygroundHelpers.PlaygroundError('Snippet cannot be empty');
        }

        if (_.isEmpty(snippet.name)) {
            throw new PlaygroundHelpers.PlaygroundError('Snippet name cannot be empty');
        }
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = _.isEmpty(name.trim()) ? 'Blank Snippet' : name.trim();
        let regex = new RegExp(`^${name}`);
        let options = this._store.values().filter(item => regex.test(item.name.trim()));
        let maxSuffixNumber = _.reduce(options, (max, item: any) => {
            let match = /\(?(\d+)?\)?$/.exec(item.name.trim());
            if (max <= ~~match[1]) {
                max = ~~match[1] + 1;
            }
            return max;
        }, 1);

        return `${newName}${(suffix ? ' - ' + suffix : '')}${(maxSuffixNumber ? ' - ' + maxSuffixNumber : '')}`;
    }

    private _upgrade(files: IGistFiles) {
        let snippet: ISnippet = {
            script: {
                content: '',
                language: 'typescript'
            },
            style: {
                content: '',
                language: 'css'
            },
            template: {
                content: '',
                language: 'html'
            },
            libraries: ''
        };

        _.forIn(files, (file, name) => {
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

        PlaygroundHelpers.AI.current.trackEvent('Upgrading snippet', { upgradeFrom: 'preview', upgradeTo: JSON.stringify(Environment.build) });
        return snippet;
    }

    private _post(path: string, params: any) {
        let form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', path);

        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                let hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }

    private getDefaultSnippet(): string {
        if (Utilities.host === HostType.WEB) {
            return compile(this.defaultSnippetIngredients.web.code,
                this.defaultSnippetIngredients.web.libraries);
        }

        let apiSetsToNamespaces = {
            'ExcelApi': 'Excel',
            'WordApi': 'Word',
            'OneNoteApi': 'OneNote'
        };

        for (let apiSet in apiSetsToNamespaces) {
            if (Office.context.requirements.isSetSupported(apiSet)) {
                let namespace = apiSetsToNamespaces[apiSet];
                return compile(
                    this.defaultSnippetIngredients.office.getHostSpecificCode(namespace),
                    this.defaultSnippetIngredients.office.libraries);
            }
        }

        return compile(
            this.defaultSnippetIngredients.office.commonApiCode,
            this.defaultSnippetIngredients.office.libraries);


        // Helper function

        function compile(code: string, libraries: string) {
            return PlaygroundHelpers.Utilities.stripSpaces(`
                author: Microsoft
                name: Blank snippet
                description: Create a new snippet from a blank template.
                script:
                  content: |-
                    $('#run').click(run);

                    {{{CODE_INDENT_4}}}
                  language: typescript
                style:
                  content: /* Your style goes here */
                  language: css
                template:
                  content: |-
                    <button id="run" class="ms-Button">
                        <span class="ms-Button-label">Run</span>
                    </button>
                  language: html
                libraries: |-
                  {{{LIBRARIES_INDENT_2}}}
            `)
                .replace('{{{CODE_INDENT_4}}}',
                PlaygroundHelpers.Utilities.indentAllExceptFirstLine(code, 4))
                .replace('{{{LIBRARIES_INDENT_2}}}',
                PlaygroundHelpers.Utilities.indentAllExceptFirstLine(libraries, 2));
        }
    }

    private defaultSnippetIngredients = {
        office: {
            getHostSpecificCode: function (namespace: string) {
                return PlaygroundHelpers.Utilities.stripSpaces(`
                    function run() {
                        {{{NAMESPACE}}}.run(async (context) => {
                            console.log("Your code goes here");
                            await context.sync();

                        }).catch(OfficeHelpers.Utilities.log);
                    }
                `).replace('{{{NAMESPACE}}}', namespace);
            },

            commonApiCode: PlaygroundHelpers.Utilities.stripSpaces(`
                function run() {
                    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
                        function (asyncResult) {
                            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                                console.log(asyncResult.error.message);
                            } else {
                                console.log('Selected data is ' + asyncResult.value);
                            }
                        }
                    );
                }
            `),

            libraries: PlaygroundHelpers.Utilities.stripSpaces(`
                // Office.js
                https://appsforoffice.microsoft.com/lib/1/hosted/Office.js

                // NPM libraries
                jquery
                office-ui-fabric-js/dist/js/fabric.min.js
                office-ui-fabric-js/dist/css/fabric.min.css
                office-ui-fabric-js/dist/css/fabric.components.min.css
                @microsoft/office-js-helpers/dist/office.helpers.min.js
                core-js/client/core.min.js

                // IntelliSense: Use dt~library_name for DefinitelyTyped or URLs to d.ts files
                dt~office-js
                dt~jquery
                dt~core-js
                @microsoft/office-js-helpers/dist/office.helpers.d.ts
            `)
        },

        web: {
            code: PlaygroundHelpers.Utilities.stripSpaces(`
                function run() {
                    console.log("Your code goes here");
                }
            `),

            libraries: PlaygroundHelpers.Utilities.stripSpaces(`
                // NPM libraries
                jquery
                office-ui-fabric-js/dist/js/fabric.min.js
                office-ui-fabric-js/dist/css/fabric.min.css
                office-ui-fabric-js/dist/css/fabric.components.min.css
                @microsoft/office-js-helpers/dist/office.helpers.min.js
                core-js/client/core.min.js

                // IntelliSense: Use dt~library_name for DefinitelyTyped or URLs to d.ts files
                dt~office-js
                dt~jquery
                dt~core-js
                @microsoft/office-js-helpers/dist/office.helpers.d.ts
            `)
        }
    };
}
