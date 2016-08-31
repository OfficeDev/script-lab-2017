import {Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs, IEditorParent} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {ISnippet, Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextUtil, ContextType, StorageHelper, MessageStrings, ExpectedError, PlaygroundError, UxUtil} from '../shared/helpers';

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
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy, IEditorParent {
    snippet: Snippet;
    
    status: string;
    statusType: StatusType;
    editMode = false;
    currentIntelliSense: string[];

    private _timeout;

    @ViewChild(Tabs) tabs: Tabs;
    @ViewChild('name') nameInputField: ElementRef;

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);
        this.snippet = new Snippet({});

        this._errorHandler = this._errorHandler.bind(this);
    }

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }

        var subscription = this._route.params.subscribe(params => {
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

        this.tabs.editorParent = this;
    }

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
                'It looks like your IntelliSense references have changed. ' + 
                'To see those changes live, please re-load this page.');
        }
    }

    back(): void {
        if (this.editMode) {
            this.editMode = false;
            return;
        }
        
        const navigateHomeAction = () => this._router.navigate(['new']);

        if (this._promptToSave) {
            UxUtil.showDialog('Save the snippet?', `Save the snippet "${this.snippet.meta.name}" before going back?`, ['Yes', 'No', 'Cancel'])
                .then((choice) => {
                    if (choice == "Cancel") {
                        return;
                    }
                    else if (choice == "Yes") {
                        this._saveHelper()
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
        if (this._promptToSave) {
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
        const navigateToShareAction = () => this._router.navigate(['share', this.snippet.meta.id]);

        if (this._promptToSave) {
            UxUtil.showDialog('Save the snippet?', `You must save the snippet before sharing it. Save it now?`, ['Save and proceed', 'Cancel'])
                .then((choice) => {
                    if (choice === "Save and proceed") {
                        this._saveHelper()
                        .then(navigateToShareAction)
                        .catch(this._errorHandler);
                    } else {
                        Utilities.reloadPage();
                    }
                });
        } else {
            navigateToShareAction();
        }
    }

    private _validateNameBeforeProceeding(): Promise<void> {
        if (Utilities.isEmpty(this.snippet.meta.name)) {
            this._showNameFieldAndSetFocus();
            return Promise.reject(new Error(MessageStrings.PleaseProvideNameForSnippet));
	    }

        return Promise.resolve();
    }

	save(): Promise<void> {
        return this._saveHelper()
            .then((snippet) => {
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
                if (this._promptToSave) {
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
                this._router.navigate(['edit', duplicateSnippet.meta.id]);
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

        setTimeout(() => {
            this.tabs.resize();
            this._changeDetectorRef.detectChanges();
        }, 100);    

        this._timeout = setTimeout(() => {
            clearTimeout(this._timeout);
            this.clearStatus();
        }, seconds * 1000);
    }

    clearStatus() {
        this.status = null;
        this.statusType = StatusType.info;

        this._changeDetectorRef.detectChanges();
        this.tabs.resize();
    }

    get isStatusWarning() { return this.statusType === StatusType.warning; }
    get isStatusError() { return this.statusType === StatusType.error; }

    launchPopOutAddinEditor() {
        var dialogOptions = {displayInIFrame: true, width: 85, height: 85};
        var url = Utilities.playgroundBasePath + "#/addin/" + ContextUtil.contextString;
        
        if (!Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
            UxUtil.showDialog("Dialog not supported",
                "Launching a standalone-editor dialog window is not supported on this platform yet.", "OK")
            return;
        }

        Office.context.ui.displayDialogAsync(url, dialogOptions, function(result) {
            if (result.status !== Office.AsyncResultStatus.Succeeded) {
                UxUtil.showDialog("Error launching dialog", [
                    "Could not create a standalone-editor dialog window.",
                    "Error details: " + result.error.message
                ], "OK");
            }

            var dialog = result.value;
            dialog.addEventHandler("DialogMessageReceived", function(e) {
                UxUtil.showDialog("Event received", Utilities.stringifyPlusPlus(e), "OK");
            });
        });
    }

    private _errorHandler(e: any): void {
        if (e instanceof ExpectedError) {
            this.clearStatus();
            return;
        } else if (e instanceof PlaygroundError) {
            this._showStatus(StatusType.error, 5 /*seconds*/, e.message);    
        } else {
            UxUtil.showErrorNotification('Error', [], e);
        }
    }

    private _composeSnippetFromEditor() {
        var currentEditorState = this.tabs.currentState;
        if (currentEditorState === null) {
            return new Snippet({});
        }

        return new Snippet({
            meta: this.snippet.meta,
            css: currentEditorState['CSS'],
            libraries: currentEditorState['Libraries'],
            script: currentEditorState['Script'],
            html: currentEditorState['HTML']
        });
    }

    private get _promptToSave() {
        return this.snippet.lastSavedHash != this._composeSnippetFromEditor().getHash();
    }
}