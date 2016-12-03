import { Injectable } from '@angular/core';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as jsyaml from 'js-yaml';
import { PlaygroundError } from '../helpers';
import { Request, ResponseTypes } from './request';
import { Snippet } from './snippet';
import { Github } from './github';
import { Notification } from './notification';
import * as _ from 'lodash';

@Injectable()
export class SnippetStore {
    private _snippets = new Storage<ISnippet>(`${this._context}Snippets`);
    private _settings = new Storage<string>('Playground');
    private _context = HostTypes[Utilities.host];

    constructor(
        private _request: Request,
        private _github: Github,
        private _notification: Notification
    ) {

    }

    get lastOpened(): string {
        return this._settings.get('LastOpened');
    }

    set lastOpened(value: string) {
        if (!(value == null) && value.trim() !== '') {
            this._settings.insert('LastOpened', value);
        }
        else {
            if (this._settings.contains('LastOpened')) {
                this._settings.remove('LastOpened');
            }
        }
    }

    async create(content?: string, suffix?: string): Promise<Snippet> {
        let result: ISnippet;
        if (content == null) {
            result = await this._request.local<ISnippet>(`snippets/${this._context.toLowerCase()}/default.yaml`, ResponseTypes.YAML).toPromise();
            if (result == null) {
                throw (new PlaygroundError('Cannot retrieve snippet template. Make sure you have an active internet connection.'));
            }
        }
        else {
            result = jsyaml.safeLoad(content);
        }

        // check if we need to generate a new name. The default one is always going to be 'New Snippet'.
        if (this._exists(result.name)) {
            result.name = this._generateName(result.name, suffix);
        }

        return new Snippet(result);
    }

    import(id: string): Promise<Snippet> {
        return new Promise<Snippet>(async (resolve, reject) => {
            let gist = await this._github.gist(id).toPromise();
            let snippet = gist.files['snippet.yml'];
            let output: ISnippet;
            if (snippet == null) {
                output = await this._upgrade(gist.files);
                output.description = '';
                output.author = '';
                output.source = '';
                output.gist = id;
            }
            else {
                output = jsyaml.safeLoad(snippet.content);
            }
            resolve(new Snippet(output));
        });
    }

    save(snippet: ISnippet): Promise<ISnippet> {
        return new Promise((resolve, reject) => {
            this._validate(snippet);
            let result = this._snippets.insert(snippet.id, snippet);
            this.lastOpened = snippet.id;
            this._notification.emit<ISnippet>('StorageEvent', snippet);
            return resolve(result);
        });
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
        let snippetJsonUrl = `snippets/${this._context.toLowerCase()}/playlist.json`;
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
