import { Injectable } from '@angular/core';
import { Utilities, Storage } from '@microsoft/office-js-helpers';
import { Observable } from 'rxjs/Observable';
import * as jsyaml from 'js-yaml';
import { PlaygroundError } from '../helpers';
import { Request, ResponseTypes } from './request';
import { Snippet } from './snippet';
import { Github } from './github';
import { Notification } from './notification';
import * as _ from 'lodash';

@Injectable()
export class SnippetStore {
    private _snippets = new Storage<ISnippet>(`${Utilities.host} Snippets`);

    constructor(
        private _request: Request,
        private _github: Github,
        private _notification: Notification
    ) {
    }

    import(data: string = null, suffix = ''): Observable<ISnippet> {
        let observable: Observable<ISnippet>;
        let importType = this._determineImportType(data);
        console.info(`Importing ${importType} Snippet`);

        switch (importType) {
            case 'LOCAL':
                observable = this._request
                    .local<string>(`snippets/${Utilities.host.toLowerCase()}/default.yaml`, ResponseTypes.YAML)
                    .map<ISnippet>(snippet => jsyaml.safeLoad(snippet));

            case 'CUID':
                observable = Observable.of(this._snippets.get(data));

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

        return observable
            .map(snippet => {
                if (this._exists(snippet.name)) {
                    snippet.name = this._generateName(snippet.name, suffix);
                }

                return snippet;
            })
            .catch(error => {
                Utilities.log(error);
                return null;
            });
    }

    createOrUpdate(snippet: ISnippet) {
        this._validate(snippet);

        if (this._snippets.contains(snippet.id)) {
            console.info(`Saving ${snippet.id}:${snippet.name}`);
            this._snippets.insert(snippet.id, snippet);
        }
        else {
            console.info(`Creating ${snippet.id}:${snippet.name}`);
            this._snippets.add(snippet.id, snippet);
        }

        return snippet;
    }

    delete(snippet: ISnippet): Promise<ISnippet> {
        return new Promise(resolve => {
            this._validate(snippet);
            let result = this._snippets.remove(snippet.id);
            this._notification.emit<ISnippet>('StorageEvent', snippet);
            return resolve(result);
        });
    }

    clear(): Promise<boolean> {
        return new Promise(resolve => {
            this._snippets.clear();
            this._notification.emit<ISnippet>('StorageEvent', null);
            return resolve(true);
        });
    }

    local(): ISnippet[] {
        return this._snippets.values();
    }

    templates(url?: string, external?: boolean): Promise<IPlaylist> {
        let snippetJsonUrl = `snippets/ ${this._context.toLowerCase()} /playlist.json`;
        return this._request.local<IPlaylist>(snippetJsonUrl, ResponseTypes.JSON).toPromise();
    }

    run(snippet: ISnippet): Promise<boolean> {
        return new Promise(resolve => {
            let yaml = jsyaml.safeDump(snippet);
            this._post('https://addin-playground-runner.azurewebsites.net', { snippet: yaml });
            return resolve(true);
        });
    }

    find(id: string): Promise<Snippet> {
        return new Promise((resolve, reject) => {
            let snippet = this._snippets.get(id);
            if (snippet == null) {
                return reject('Could not find snippet in localStorage');
            }
            return resolve(new Snippet(snippet));
        });
    }

    private _determineImportType(data: string): 'LOCAL' | 'CUID' | 'URL' | 'GIST' | 'YAML' {
        if (data == null || data.trim() === '') {
            return 'LOCAL';
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
        return this._snippets.values().some(item => item.name.trim() === name.trim());
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
        let options = this._snippets.values().filter(item => regex.test(item.name.trim()));
        let maxSuffixNumber = _.reduce(options, (max, item) => {
            let match = /\(?(\d+)?\)?$/.exec(item.name.trim());
            if (max <= ~~match[1]) {
                max = ~~match[1] + 1;
            }
            return max;
        }, 0);

        return `${newName}${(suffix ? ' - ' + suffix : '')}${(maxSuffixNumber ? ' - ' + maxSuffixNumber : '')}`;
    }

    private _post(path, params) {
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
