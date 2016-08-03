import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {ISnippet, Snippet, SnippetService} from '../services';
import {StorageHelper, Utilities} from '../helpers';

@Injectable()
export class SnippetManager {
    private _snippetsContainer: StorageHelper<ISnippet>;

    constructor(private _service: SnippetService) {
        this._snippetsContainer = new StorageHelper<ISnippet>('snippets');
    }

    save(snippet: ISnippet): Promise<any> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) return Promise.reject('Snippet metadata cannot be empty');
        if (Utilities.isEmpty(snippet.meta.name)) return Promise.reject('Snippet name cannot be empty');
        return Promise.resolve(this._snippetsContainer.insert(snippet.meta.id, snippet));
    }

    delete(snippet: ISnippet): Promise<any> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) return Promise.reject('Snippet metadata cannot be empty');
        if (Utilities.isEmpty(snippet.meta.name)) return Promise.reject('Snippet name cannot be empty');
        return Promise.resolve(this._snippetsContainer.remove(snippet.meta.id));
    }

    get() {
        return Promise.resolve(this._snippetsContainer.values());
    }

    import(privateLink: string): Promise<any> {
        var snippetId: string = null;

        var regex = /^^(https?:\/\/[^/]+)\/(?:api\/)?snippets\/([0-9a-z]+)\/?$/;
        var matches = regex.exec(privateLink);
        if (matches) {
            snippetId = matches[2];
        }
        else {
            var altRegex = /^[0-9a-z]+$/;
            if (altRegex.exec(privateLink)) {
                snippetId = privateLink;
            }
            else {
                return Promise.reject('Please provide either the snippet ID or snippet URL');
            }
        }

        return this._service.get(snippetId)
            .then(snippet => this._makeNameUniqueAndSave(snippet));
    }

    find(id: string) {
        var result = this._snippetsContainer.get(id);
        return Promise.resolve(new Snippet(result));
    }

    duplicate(snippet: ISnippet): Snippet {
        var newSnippet = new Snippet(snippet);
        newSnippet.randomizeId();
        return this._makeNameUniqueAndSave(newSnippet);
    }

    publish(snippet: ISnippet, password?: string): Promise<any> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) return Promise.reject('Snippet metadata cannot be empty');
        return this._service.create(snippet.meta.name, password)
            .then(data => {
                snippet.meta.id = data.id;
                snippet.meta.key = data.password;
            })
            .then(data => this._uploadAllContents(snippet))
    }

    update(snippet: ISnippet, password: string): Promise<any> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) return Promise.reject('Snippet metadata cannot be empty');
        if (Utilities.isEmpty(snippet.meta.name)) return Promise.reject('Snippet name cannot be empty');
        if (Utilities.isEmpty(snippet.meta.id)) return Promise.reject('Snippet id cannot be empty');
        return this._uploadAllContents(snippet);
    }

    private _uploadAllContents(snippet: ISnippet) {
        var uploadJs = () => {
            if (Utilities.isEmpty(snippet.ts)) return Promise.resolve() as Promise<any>;
            return this._service.uploadContent(snippet, 'js');
        };

        var uploadHtml = () => {
            if (Utilities.isEmpty(snippet.html)) return Promise.resolve() as Promise<any>;
            return this._service.uploadContent(snippet, 'html');
        };

        var uploadCss = () => {
            if (Utilities.isEmpty(snippet.css)) return Promise.resolve() as Promise<any>;
            return this._service.uploadContent(snippet, 'css');
        };

        var uploadExtras = () => {
            if (Utilities.isEmpty(snippet.extras)) return Promise.resolve() as Promise<any>;
            return this._service.uploadContent(snippet, 'extras');
        };

        return Promise.all([uploadJs(), uploadCss(), uploadHtml(), uploadExtras()]);
    }

    private _makeNameUniqueAndSave(snippet: ISnippet): Snippet {
        var newSnippet = new Snippet(snippet);
        newSnippet.meta.name = "New Snippet";

        while (this._snippetsContainer.contains(newSnippet.meta.id)) {
            newSnippet.randomizeId();
        }

        let escapedName = this._escapeRegex(newSnippet.meta.name);
        let regex = new RegExp('^' + escapedName + ' \\(([0-9]+)\\)$');
        var maxSeen = 0;
        this._snippetsContainer.keys().forEach(key => {
            var matches = regex.exec(key);
            if (matches) {
                var num = +matches[1];
                if (num > maxSeen) maxSeen = num;
            }
        });
        newSnippet.meta.name = newSnippet.meta.name + ' (' + (maxSeen + 1) + ')';
        this._snippetsContainer.add(newSnippet.meta.id, newSnippet);
        return newSnippet;
    }

    private _escapeRegex(input: string) {
        return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}