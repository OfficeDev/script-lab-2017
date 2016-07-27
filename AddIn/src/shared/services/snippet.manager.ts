import {Injectable, OnInit, OnDestroy} from '@angular/core';
import {Http} from '@angular/http';
import {Snippet, SnippetsService} from '../services';
import {StorageHelper, Utilities} from '../helpers';

@Injectable()
export class SnippetManager implements OnInit, OnDestroy {
    private _snippetsContainer: StorageHelper<Snippet>;

    constructor(private _service: SnippetsService) {
        this._snippetsContainer = new StorageHelper<Snippet>('snippets');
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    getAllSnippets() {
        return this._snippetsContainer.values();
    }

    importFromWeb(privateLink: string): Promise<Snippet> {
        var snippetId: string = null;

        var regex = /^^(https?:\/\/[^/]+)\/(?:api\/)?snippets\/([0-9a-z]+)\/?$/;
        var matches = regex.exec(privateLink);
        if (matches) {
            snippetId = matches[2];
        } else {
            // Maybe the user pasted the id directly
            var altRegex = /^[0-9a-z]+$/;
            if (altRegex.exec(privateLink)) {
                snippetId = privateLink;
            } else {
                throw "Invalid link.";
            }
        }

        return this._service.get(snippetId)
            .then(snippet => this._makeNameUniqueAndSave(snippet));
    }

    findByName(name: string): Snippet {
        var result = this._snippetsContainer.get(name);
        return new Snippet(result.meta, result.ts, result.html, result.css, result.extras);
    }

    duplicateSnippet(snippet: Snippet): Snippet {
        var oldMeta = snippet.meta || { name: null, id: null };
        var newMeta = {
            name: oldMeta.name,
            id: oldMeta.id
        }
        var newSnippet = new Snippet(newMeta, snippet.ts, snippet.html, snippet.css, snippet.extras);
        return this._makeNameUniqueAndSave(newSnippet);
    }

    publishSnippet(snippet: Snippet, password?: string) {
        if (Utilities.isNull(snippet.meta) || Utilities.isEmpty(snippet.meta.name)) {
            throw "Snippet name not specified.";
        }

        var createResult: { id: string, password: string };
        return this._service.create(snippet.meta.name, password)
            .then(data => {
                createResult = data;
                return this._uploadAllContents(snippet, data.id, data.password);
            }).then(() => {
                snippet.meta.id = createResult.id;
            })
    }

    publishSnippetUpdate(snippet: Snippet, password: string) {
        if (Utilities.isNull(snippet.meta) || Utilities.isEmpty(snippet.meta.id)) {
            throw "Snippet id not specified.";
        }
        if (Utilities.isEmpty(snippet.meta.name)) {
            throw "Snippet name not specified.";
        }

        return this._uploadAllContents(snippet, snippet.meta.id, password);
    }

    private _uploadAllContents(snippet: Snippet, id: string, password: string) {
        return Promise.resolve()
            .then(() => {
                if (Utilities.isEmpty(snippet.ts)) return;
                return this._service.uploadContent(id, password, 'js', snippet.ts);
            })
            .then(() => {
                if (Utilities.isEmpty(snippet.html)) return;
                return this._service.uploadContent(id, password, 'html', snippet.html);
            })
            .then(() => {
                if (Utilities.isEmpty(snippet.css)) return;
                return this._service.uploadContent(id, password, 'css', snippet.css);
            })
            .then(() => {
                if (Utilities.isEmpty(snippet.extras)) return;
                return this._service.uploadContent(id, password, 'extras', snippet.extras);
            });
    }

    private _makeNameUniqueAndSave(snippet: Snippet): Snippet {
        if (Utilities.isNull(snippet.meta)) {
            snippet.meta = { name: null, id: null };
        }

        var name = "Unnamed snippet";
        if (!Utilities.isEmpty(snippet.meta.name)) {
            name = snippet.meta.name;
        }

        if (this._snippetsContainer.contains(name)) {
            let escapedName = SnippetManager._escapeRegex(name);
            let regex = new RegExp('^' + escapedName + ' \\(([0-9]+)\\)$');
            var maxSeen = 0;
            this._snippetsContainer.keys().forEach(key => {
                var matches = regex.exec(key);
                if (matches) {
                    var num = +matches[1];
                    if (num > maxSeen) maxSeen = num;
                }
            });
            name = name + ' (' + (maxSeen + 1) + ')';
        }
        snippet.meta.name = name;

        this._snippetsContainer.add(name, snippet);
        return snippet;
    }

    private static _escapeRegex(input: string) {
        return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}