import { Injectable } from '@angular/core';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as jsyaml from 'js-yaml';
import { PlaygroundError } from '../helpers';
import { Request, ResponseTypes } from './request';
import { Snippet } from './snippet';
import { Notification } from './notification';
import * as _ from 'lodash';

@Injectable()
export class SnippetManager {
    private _store: Storage<ISnippet>;
    private _context: string;

    constructor(
        private _request: Request,
        private _notification: Notification
    ) {
        this._context = HostTypes[Utilities.host];
        this._store = new Storage<ISnippet>(`${this._context}Snippets`);
    }

    async create(suffix?: 'string'): Promise<Snippet> {
        let snippet = await this._request.local<ISnippet>(`snippets/${this._context.toLowerCase()}/default.yml`, ResponseTypes.YAML);
        this._notification.emit<ISnippet>('StorageEvent', snippet);
        if (this.exists(snippet.name)) {
            snippet.name = this._generateName(snippet.name);
        }
        return new Snippet(snippet);
    }

    save(snippet: ISnippet): Promise<ISnippet> {
        return new Promise((resolve, reject) => {
            this._validate(snippet);
            this._notification.emit<ISnippet>('StorageEvent', snippet);
            return Promise.resolve(this._store.insert(snippet.id, snippet));
        });
    }

    delete(snippet: ISnippet): Promise<any> {
        this._notification.emit<ISnippet>('StorageEvent', snippet);
        return new Promise(resolve => {
            this._validate(snippet);
            this._store.remove(snippet.id);
        });
    }

    deleteAll(): Promise<any> {
        this._notification.emit<ISnippet>('StorageEvent', null);
        return Promise.resolve(this._store.clear());
    }

    local(): ISnippet[] {
        return this._store.values();
    }

    templates(url?: string, external?: boolean): Promise<IPlaylist> {
        let snippetJsonUrl = `snippets/${this._context.toLowerCase()}/playlist.json`;
        return this._request.local<IPlaylist>(snippetJsonUrl, ResponseTypes.JSON);
    }

    find(id: string): Promise<Snippet> {
        return new Promise((resolve, reject) => {
            let result = this._store.get(id);
            return resolve(new Snippet(result));
        });
    }

    run(snippet: ISnippet) {
        return new Promise(resolve => {
            let yaml = jsyaml.safeDump(snippet);
            this._post('https://office-playground-runner.azurewebsites.net', yaml);
        });
    }

    exists(name: string) {
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
}
