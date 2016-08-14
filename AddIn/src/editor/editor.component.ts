import {Component, ViewChild, OnInit, OnDestroy, ElementRef} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextType, StorageHelper, MessageStrings, ExpectedError} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet = new Snippet({ meta: { name: null, id: null } });
    
    status: string;
    error = false;
    editMode = false;

    private _isBrandNewUnsavedSnippet = false;
    private _lastSaveHash: string;
    private _timeout;

    @ViewChild(Tabs) tabs: Tabs;
    @ViewChild('name') nameInputField: ElementRef;

    constructor(
        private _snippetManager: SnippetManager,
        private _location: Location,
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();

        this._errorHandler = this._errorHandler.bind(this);
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params =>
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this.snippet = snippet;
                    if (params['new']) {
                        this._isBrandNewUnsavedSnippet = true;
                    }
                    this._lastSaveHash = this.snippet.computeHash();
                })
                .catch(this._errorHandler)
        );

        this.markDispose(subscription);

        this.tabs.setSaveAction(() => {
             this.save();
        })
    }

    // TODO (ask Bhargav): how to validate name?
    // onNameChange() {
    //     var snippetsContainer = SnippetManager.getLocalSnippetsContainer();
    //     if (snippetsContainer.contains(this.snippet.meta.name)) {
    //         this._rejectName(MessageStrings.NameAlreadyExists);
    //     }
    //     this.snippet.meta.name = $(this.nameInputField.nativeElement).val();
    // }

    private _showNameFieldAndSetFocus(): void {
        this.editMode = true;
        setTimeout(() => {
            $(this.nameInputField.nativeElement).focus(); // TODO: doesn't seem to do anything
        }, 100);
    }

    back(): void {
        if (this.editMode) {
            this.editMode = false;
            return;
        }
        
        const navigateHomeAction = () => this._router.navigate(['new']);

        var promptToSave = 
            (this._lastSaveHash != this._composeSnippetFromEditor().computeHash()) ||
            this._isBrandNewUnsavedSnippet;

        if (promptToSave && window.confirm(`Save the snippet "${this.snippet.meta.name}" before going back?`)) {
            this._saveHelper()
                .then(navigateHomeAction)
                .catch(this._errorHandler);
        } else if (this._isBrandNewUnsavedSnippet) {
            // If user is going back, having never explicitly saved, just delete the snippet.
            this._snippetManager.delete(this.snippet, false /*askForConfirmation*/)
                .then(navigateHomeAction)
                .catch(this._errorHandler);
        } else {
            navigateHomeAction();
        }
    }

    share() {

    }

    private _validateNameBeforeProceeding(): Promise<void> {
        if (Utilities.isEmpty(this.snippet.meta.name)) {
            this._showNameFieldAndSetFocus();
            return Promise.reject(new Error(MessageStrings.PleaseProvideNameForSnippet));
	    }

        var containsAnotherSnippetWithSameName =
            this._snippetManager.getLocal().find((item) => 
                (item.meta.id != this.snippet.meta.id && item.meta.name == this.snippet.meta.name));
        
        if (containsAnotherSnippetWithSameName) {
            this._showNameFieldAndSetFocus();
            return Promise.reject(new Error(MessageStrings.SnippetNameAlreadyTaken));
        }

        return Promise.resolve();
    }

	save(): Promise<void> {
        return this._saveHelper()
            .then((snippet) => {
                this._isBrandNewUnsavedSnippet = false;
                this._lastSaveHash = snippet.computeHash();
	            this._showStatus(`Saved "${snippet.meta.name}"`);
            })
            .catch(this._errorHandler);
    }

    private _saveHelper(): Promise<Snippet> {
        return this._validateNameBeforeProceeding().then(() => {
            this.snippet = this._composeSnippetFromEditor();
	        return this._snippetManager.save(this.snippet);
        });
    }

	delete(): Promise<void> {
        return this._snippetManager.delete(this.snippet, true /*askForConfirmation*/)
            .then(() => {
                this._router.navigate(['new']);
            })
            .catch(this._errorHandler);
    }

    run(): Promise<any> {
        return this._validateNameBeforeProceeding()
            .then(() => this.save())
            .then(() => this._router.navigate(['run', this.snippet.meta.id, true /*returnToEdit*/]))
            .catch(this._errorHandler);
    }

    duplicate(): Promise<void> {
        return this._validateNameBeforeProceeding()
            .then(() => this._snippetManager.duplicate(this._composeSnippetFromEditor()))
            .then(duplicateSnippet => {
                this._router.navigate(['edit', duplicateSnippet.meta.id, true /*new*/]);
                return duplicateSnippet
            })
            .then((duplicateSnippet) => {
                this._showStatus('Created duplicate snippet');
                this._showNameFieldAndSetFocus();
            })
            .catch(this._errorHandler);
    }

    private _showStatus(message: string, error?: boolean): void {
        if (!Utilities.isNull(this._timeout)) {
            clearTimeout(this._timeout);
        }

        this.status = message;
        this.error = error;

        this._timeout = setTimeout(() => {
            clearTimeout(this._timeout);
            this.status = null;
            this.error = false;
        }, 5000);
    }

    private _errorHandler(e: any): void {
        if (_.isString(e)) {
            this._showStatus(e, true /*error*/);
        } else if (e instanceof ExpectedError) {
            this._showStatus(e.message, false /*error*/);
        } else if (e instanceof Error) {
            this._showStatus(e.message, true /*error*/);
        } else {
            this._showStatus(e, true /*error*/);
        }
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