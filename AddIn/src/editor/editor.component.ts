import {Component, ViewChild, OnInit, OnDestroy} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextType} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet = new Snippet({ meta: { name: null, id: null } });
    status: string;
    error: boolean;
    editMode: boolean = false;
    editorLoaded: boolean = false;
    private timeout;

    @ViewChild(Tabs) tabs: Tabs;

    constructor(
        private _snippetManager: SnippetManager,
        private _location: Location,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params =>
            this._snippetManager.find(params['id'])
                .then(snippet => this.snippet = snippet)
                .catch(e => this._showStatus(e, true))
        );

        this.markDispose(subscription);

        this.tabs.setSaveAction(() => {
             this.save();
        })
    }

    back() {
        this._router.navigate(['new']);
    }

    share() {

    }

    private _forceNameOrStop(): boolean {
        if (Utilities.isEmpty(this.snippet.meta.name)) {
            this._showStatus("Please provide a name for the snippet.", true);
            this.editMode = true;
            return true;
	    }
        return false;
    }

	save(): Promise<void> {
        if (this._forceNameOrStop()) {
            return Promise.resolve();
        }

        this.snippet = this._composeSnippetFromEditor();
	    return this._snippetManager.save(this.snippet)
            .then(snippet => {
               this._showStatus('Saved ' + snippet.meta.name);
            })
            .catch(e => {
                this._showStatus(e, true);
            })
    }

	delete(): Promise<void> {
        return this._snippetManager.delete(this.snippet)
            .then(snippet => {
                return this._showStatus('Deleted ' + this.snippet.meta.name)
                    .then(() => {
                        this._router.navigate(['new']);
                    });
            })
            .catch(e => {
                return this._showStatus(e, true);
            });
    }

    run(): Promise<void> {
        if (this._forceNameOrStop()) {
            return Promise.resolve();
        }

        this.save().then(() => { 
            this._router.navigate(['run', this.snippet.meta.id]);
        });
    }

    duplicate(): Promise<void> {
        if (this._forceNameOrStop()) {
            return Promise.resolve();
        }

        this._snippetManager.duplicate(this._composeSnippetFromEditor())
            .then(duplicateSnippet => {
                this._router.navigate(['edit', duplicateSnippet.meta.id]);
                return duplicateSnippet
            })
            .then((duplicateSnippet) => {
                this._showStatus('Created duplicate snippet ' + duplicateSnippet.meta.name)
            })
            .catch(e => {
                return this._showStatus(e, true);
            });
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
                }, 5000);
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
            extras: currentEditorState['Libraries'],
            ts: currentEditorState['JavaScript'],
            html: currentEditorState['HTML']
        });
    }
}