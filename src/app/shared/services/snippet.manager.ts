import { Injectable } from '@angular/core';
import { Storage } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Request } from './request';
import { Snippet } from './snippet';
import { ContextTypes, Utilities, Theme, MessageStrings, ExpectedError, PlaygroundError, UxUtil } from '../helpers';

@Injectable()
export class SnippetManager {
    private _store: Storage<ISnippet>;
    private _context: string;

    constructor(private _request: Request) {
        this._context = ContextTypes[Utilities.context];
        this._store = new Storage<ISnippet>(`${this._context.toLowerCase()}_snippets`);
    }

    new(): Promise<Snippet> {
        return (this._request.local<ISnippet>('snippets/default.json') as Promise<ISnippet>)
            .then(snippet => new Snippet(snippet));
    }

    create(snippet: Snippet, suffix: string): Promise<Snippet> {
        return new Promise(resolve => {
            snippet.content.name = this._generateName(snippet.content.name, suffix);
            this._store.add(snippet.content.id, snippet.content.name);
        });
    }

    copy(snippet: Snippet): Promise<Snippet> {
        return this.create(new Snippet(snippet.content), 'copy');
    }

    save(snippet: Snippet): Promise<ISnippet> {
        if (snippet == null) {
            return Promise.reject(new Error('Snippet metadata cannot be empty')) as any;
        }

        if (Utilities.isEmpty(snippet.content.name)) {
            return Promise.reject(new Error('Snippet name cannot be empty')) as any;
        }

        if (!this._isNameUnique(snippet.content.name)) {
            return Promise.reject(new Error('Snippet name must be unique')) as any;
        }

        return Promise.resolve(this._store.insert(snippet.content.id, snippet.content));
    }

    delete(snippet: Snippet, askForConfirmation: boolean): Promise<any> {
        if (snippet == null) {
            return Promise.reject(new Error('Snippet metadata cannot be empty'));
        }

        let that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                `Are you sure you want to delete the snippet "${snippet.content.name}"?`, ['Yes', 'No'])
                .then((choice) => {
                    if (choice === 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._store.remove(snippet.content.id);
            return Promise.resolve();
        }
    }

    deleteAll(askForConfirmation: boolean): Promise<any> {
        let that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                'Are you sure you want to delete *ALL* of your local snippets?', ['Yes', 'No'])
                .then((choice) => {
                    if (choice === 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._store.clear();
            return Promise.resolve();
        }
    }

    local(): Promise<ISnippet[]> {
        return Promise.resolve(this._store.values());
    }

    playlist(url, external?: boolean): Promise<IPlaylist> {
        let snippetJsonUrl = `snippets/${this._context.toLowerCase()}.json}`;
        return (this._request.local<IPlaylist>(snippetJsonUrl) as Promise<IPlaylist>)
            .catch(e => {
                let messages = [`Could not retrieve default snippets for ${this._context}.`];
                _.concat(messages, UxUtil.extractErrorMessage(e));
                throw new PlaygroundError(messages);
            });
    }

    find(id: string): Promise<Snippet> {
        return new Promise(resolve => {
            let result = this._store.get(id);
            resolve(new Snippet(result));
        });
    }

    private _generateName(name: string, suffix: string = ''): string {
        let newName = Utilities.isEmpty(name.trim()) ? 'New Snippet' : name.trim();
        let regex = new RegExp(`^${name}`, 'gi');
        let maxSuffixNumber = _.reduce(this._store.values(), (max, item) => {
            if (regex.test(item.name)) {
                let match = /(\d+)$/.exec(item.name);
                if (max <= +match[1]) {
                    max = +match[1] + 1;
                }
            }
            return max;
        }, 0);

        return `${name}${(suffix ? ' - ' + suffix : '')}${(maxSuffixNumber ? ' - ' + maxSuffixNumber : '')}`;
    }

    private _isNameUnique = (name: string) => !(this._store.values().find(item => item.name.trim() === name.trim()) == null);
}
