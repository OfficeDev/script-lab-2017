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

    importFromWeb(privateLink: string): Promise<void> {
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

    private _makeNameUniqueAndSave(snippet: Snippet) {
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
    }

    private static _escapeRegex(input: string) {
        return input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    // TODO: Add methods to call Snippets.Service and store in localStoraege
}