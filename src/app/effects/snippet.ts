import { Injectable } from '@angular/core';
import { Utilities, Storage } from '@microsoft/office-js-helpers';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import { PlaygroundError } from '../helpers';
import { Request, ResponseTypes, Github } from '../services';
import { Action } from '@ngrx/store';
import * as SnippetActions from '../actions/snippet';
import { Effect, Actions } from '@ngrx/effects';
import * as _ from 'lodash';

@Injectable()
export class SnippetEffects {
    private _store = new Storage<ISnippet>(`${Utilities.host} Snippets`);

    constructor(
        private actions$: Actions,
        private _request: Request,
        private _github: Github
    ) {
    }

    @Effect()
    import$: Observable<Action> = this.actions$
        .ofType(SnippetActions.SnippetActionTypes.IMPORT)
        .map((action: SnippetActions.ImportAction) => ({ data: action.payload, suffix: action.params }))
        .mergeMap(({ data, suffix }) => {
            console.log(data, suffix);
            let observable: Observable<ISnippet>;
            let importType = this._determineImportType(data);
            console.info(`Importing ${importType} Snippet`);

            switch (importType) {
                case 'DEFAULT':
                    observable = this._request
                        .local<string>(`snippets/${Utilities.host.toLowerCase()}/default.yaml`, ResponseTypes.YAML)
                        .map<ISnippet>(snippet => jsyaml.safeLoad(snippet));

                case 'CUID':
                    observable = Observable.of(this._store.get(data));

                case 'GIST':
                    observable = this._github.gist(data).map<ISnippet>(gist => {
                        let snippet = gist.files['snippet.yml'];
                        if (snippet == null) {
                            let output = this._upgrade(gist.files);
                            output.description = '';
                            output.author = '';
                            output.source = '';
                            output.gist = data;
                            return output;
                        }
                        else {
                            return jsyaml.safeLoad(snippet.content);
                        }
                    });

                case 'URL':
                    observable = this._request.get<string>(data, ResponseTypes.TEXT)
                        .map<ISnippet>(snippet => jsyaml.safeLoad(snippet));

                default:
                    observable = Observable.of(jsyaml.safeLoad(data));
            }

            return observable.map(snippet => {
                if (this._exists(snippet.name)) {
                    snippet.name = this._generateName(snippet.name, suffix);
                }

                return new SnippetActions.ImportSuccess(snippet, importType !== 'CUID');
            });
        });

    @Effect()
    save$: Observable<Action> = this.actions$
        .ofType(SnippetActions.SnippetActionTypes.SAVE)
        .map((action: SnippetActions.SaveAction) => action.payload)
        .map(snippet => {
            this._validate(snippet);

            if (this._store.contains(snippet.id)) {
                console.info(`Saving ${snippet.id}:${snippet.name}`);
                this._store.insert(snippet.id, snippet);
            }
            else {
                console.info(`Creating ${snippet.id}:${snippet.name}`);
                this._store.add(snippet.id, snippet);
            }

            return new SnippetActions.StoreUpdated();
        });

    @Effect()
    delete$: Observable<Action> = this.actions$
        .ofType(SnippetActions.SnippetActionTypes.DELETE)
        .map((action: SnippetActions.DeleteAction) => action.payload)
        .map(id => this._store.remove(id))
        .map(() => new SnippetActions.StoreUpdated());

    @Effect()
    deleteAll$: Observable<Action> = this.actions$
        .ofType(SnippetActions.SnippetActionTypes.DELETE_ALL)
        .map((action: SnippetActions.DeleteAllAction) => this._store.clear())
        .map(() => new SnippetActions.StoreUpdated());

    @Effect()
    local(): ISnippet[] {
        return this._store.values();
    }

    private _determineImportType(data: string): 'DEFAULT' | 'CUID' | 'URL' | 'GIST' | 'YAML' {
        if (data === 'default') {
            return 'DEFAULT';
        }

        if (data.length === 25) {
            return 'CUID';
        }

        if (data.length === 32) {
            return 'GIST';
        }

        if (/^https ? /.test(data)) {
            return 'URL';
        }

        return 'YAML';
    }

    private _exists(name: string) {
        return this._store.values().some(item => item.name.trim() === name.trim());
    }

    private _validate(snippet: ISnippet) {
        if (_.isEmpty(snippet)) {
            throw new PlaygroundError('Snippet cannot be empty');
        }

        if (_.isEmpty(snippet.name)) {
            throw new PlaygroundError('Snippet name cannot be empty');
        }
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = _.isEmpty(name.trim()) ? 'New Snippet' : name.trim();
        let regex = new RegExp(`^${name}`);
        let options = this._store.values().filter(item => regex.test(item.name.trim()));
        let maxSuffixNumber = _.reduce(options, (max, item) => {
            let match = /\(?(\d+)?\)?$/.exec(item.name.trim());
            if (max <= ~~match[1]) {
                max = ~~match[1] + 1;
            }
            return max;
        }, 0);

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

        return snippet;
    }
}
