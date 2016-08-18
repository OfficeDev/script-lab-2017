import {Component, ViewChild, OnInit, OnDestroy, ElementRef} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextType, StorageHelper, MessageStrings, ExpectedError, UxUtil} from '../shared/helpers';

enum StatusType {
    info,
    warning,
    error
}

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet = new Snippet({ meta: { name: null, id: null } });
    
    status: string;
    statusType: StatusType;
    editMode = false;
    currentIntelliSense: string[];

    private _isBrandNewUnsavedSnippet = false;
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
        var subscription = this._route.params.subscribe(params => {
            if (params['new'] === 'true') {
                this._isBrandNewUnsavedSnippet = true;
            }
            
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this.snippet = snippet;
                    this.currentIntelliSense = snippet.getTypeScriptDefinitions();
                })
                .catch(this._errorHandler);
            }
        );

        this.markDispose(subscription);

        this.tabs.setSaveAction(() => {
             this.save();
        })

        this.tabs.parentEditor = this;
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

    onSwitchFocusToJavaScript(): void {
        var newIntelliSenseDefinitions = this._composeSnippetFromEditor().getTypeScriptDefinitions();
        if (!_.isEqual(this.currentIntelliSense, newIntelliSenseDefinitions)) {
            this._showStatus(StatusType.warning, 10 /*seconds*/,
                "It looks like your IntelliSense references have changed. " + 
                'To see those changes live, please re-load this page (see the "refresh" icon at thee bottom right corner.');
        }
    }

    back(): void {
        if (this.editMode) {
            this.editMode = false;
            return;
        }
        
        const navigateHomeAction = () => this._router.navigate(['new']);

        var promptToSave = 
            (this.snippet.hash != this._composeSnippetFromEditor().hash) ||
            this._isBrandNewUnsavedSnippet;

        if (promptToSave) {
            UxUtil.showDialog('Save the snippet?', `Save the snippet "${this.snippet.meta.name}" before going back?`, ['Yes', 'No', 'Cancel'])
                .then((choice) => {
                    if (choice == "Cancel") {
                        return;
                    }
                    else if (choice == "Yes") {
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
                });
        } else {
            navigateHomeAction();
        }
    }

    refresh(): void {
        var promptToSave = 
            (this.snippet.hash != this._composeSnippetFromEditor().hash) ||
            this._isBrandNewUnsavedSnippet;

        if (promptToSave) {
            UxUtil.showDialog('Save the snippet?', `Save the snippet "${this.snippet.meta.name}" before re-loading the page?`, ['Save', 'Discard Changes'])
                .then((choice) => {
                    if (choice == "Save") {
                        this._saveHelper()
                        .then(Utilities.reloadPage)
                        .catch(this._errorHandler);
                    } else {
                        Utilities.reloadPage();
                    }
                });
        } else {
            Utilities.reloadPage();
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
	            this._showStatus(StatusType.info, 3 /*seconds*/,`Saved "${snippet.meta.name}"`);
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
            .then(() => {
                if (this.snippet.hash != this._composeSnippetFromEditor().hash) {
                    const message = "You need to save the snippet before running it. " + 
                        "Would you like to save now? Alternatively, if you're in the middle of a risky change, " + 
                        "you can cancel out of this dialog and click \"duplicate\" instead before running the duplicated snippet."; 
                    
                    return UxUtil.showDialog("Save your snippet?", message, ['Save', 'Cancel out'])
                        .then((choice) => {
                            if (choice == 'Save') {
                                return this._saveHelper();
                            } else {
                                throw new ExpectedError();
                            }
                        });
                }
            })
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
                this._showStatus(StatusType.info, 3 /*seconds*/, 'Created duplicate snippet');
                this._showNameFieldAndSetFocus();
            })
            .catch(this._errorHandler);
    }

    private _showStatus(statusType: StatusType, seconds: number, message: string): void {
        if (!Utilities.isNull(this._timeout)) {
            clearTimeout(this._timeout);
        }

        this.status = message;
        this.statusType = statusType;

        this._timeout = setTimeout(() => {
            clearTimeout(this._timeout);
            this.clearStatus();
        }, seconds * 1000);
    }

    clearStatus() {
        this.status = null;
        this.statusType = StatusType.info;
    }

    get isStatusWarning() { return this.statusType === StatusType.warning; }
    get isStatusError() { return this.statusType === StatusType.error; }

    private _errorHandler(e: any): void {
        if (e instanceof ExpectedError) {
            this.clearStatus();
            return;
        }
        
        var message = UxUtil.extractErrorMessage(e);
        this._showStatus(StatusType.error, 5 /*seconds*/, message);
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