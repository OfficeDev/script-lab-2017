import {Component, ViewChild, OnInit, OnDestroy} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet: Snippet;
    status: string;
    error: boolean;
    private timeout;

    @ViewChild(Tabs) tabs: Tabs;

    constructor(
        private _snippetManager: SnippetManager,
        private _location: Location,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();
        this.snippet = new Snippet(<ISnippet>{
            meta: {
                name: null,
                id: null
            },
            css: null,
            html: null,
            ts: null
        })
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['id']);
            try {
                if (!Utilities.isEmpty(snippetName)) {
                    this.snippet = this._snippetManager.find(id);
                }
            }
            catch (e) {
                this._showStatus(e, true);
            }
        });

        this.markDispose(subscription);
    }

    back() {
        this._location.replaceState('');
        this._router.navigate(['']);
    }

    share() {

    }

    save() {
        try {
            this.snippet = this._composeSnippetFromEditor();
            var snippet = this._snippetManager.saveSnippet(this.snippet);
            this._showStatus('Saved ' + snippet.meta.name);
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    delete() {
        try {
            this._snippetManager.deleteSnippet(this.snippet);
            this._showStatus('Deleted ' + this.snippet.meta.name)
                .then(() => {
                    this._location.replaceState('');
                    this._router.navigate(['']);
                });
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    run() {
        this._router.navigate(['run', Utilities.encode(this.snippet.meta.name)]);
    }

    duplicate() {
        try {
            var duplicateSnippet = this._snippetManager.duplicateSnippet(this.snippet);
            this._showStatus('Created ' + duplicateSnippet.meta.name).then(() => {
                this._router.navigate(['edit', Utilities.encode(duplicateSnippet.meta.name)]);
            });
        }
        catch (e) {
            this._showStatus(e, true);
        }
    }

    private _showStatus(message: string, error?: boolean) {
        return new Promise((resolve, reject) => {
            try {
                if (!Utilities.isNull(this.timeout)) clearTimeout(this.timeout);
                this.status = message;
                this.error = error;

                this.timeout = setTimeout(() => {
                    clearTimeout(this.timeout);
                    this.status = null;
                    this.error = false;
                    resolve();
                }, 2000);
            }
            catch (exception) {
                reject(exception);
            }
        });
    }

    private _composeSnippetFromEditor() {
        var currentEditorState = this.tabs.currentState;
        return new Snippet(<ISnippet>{
            meta: this.snippet.meta,
            css: currentEditorState['CSS'],
            extras: currentEditorState['Extras'],
            ts: currentEditorState['JS'],
            html: currentEditorState['HTML']
        });
    }
}