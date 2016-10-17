import { Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Tab, Tabs, IEditorParent } from '../shared/components';
import { BaseComponent } from '../shared/components/base.component';
import { ISnippet, Snippet, SnippetManager } from '../shared/services';
import { Utilities, ContextUtil, ContextType, StorageHelper, MessageStrings, ExpectedError, PlaygroundError, UxUtil } from '../shared/helpers';

enum StatusType {
    info,
    warning,
    error
}

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss']
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy, IEditorParent {
    snippet: Snippet;

    status: string;
    statusType: StatusType;
    editMode = false;
    currentIntelliSense: string[];

    private _doneWithInitialIntelliSenseLoad = false;

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

        this.tabs.editorParent = this;

        var subscription = this._route.params.subscribe(params => {
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this.snippet = snippet;
                    this.currentIntelliSense = snippet.getTypeScriptDefinitions();

                    this._showStatus(StatusType.warning, -1 /* seconds. negative = indefinite */, "Loading IntelliSense...");
                    this.tabs.initiateLoadIntelliSense()
                        .then(() => {
                            this.clearStatus();
                            this._doneWithInitialIntelliSenseLoad = true;
                        })
                        .catch(UxUtil.catchError("An error occurred while loading IntelliSense.", []))
                })
                .catch(this._errorHandler);
        }
        );

        this.markDispose(subscription);

        this.tabs.setSaveAction(() => {
            this.save();
        })
    }

    private _showNameFieldAndSetFocus(): void {
        this.editMode = true;
        setTimeout(() => {
            $(this.nameInputField.nativeElement).focus(); // TODO: doesn't seem to do anything
        }, 100);
    }

    onSwitchFocusToJavaScript(): void {
        if (!this._doneWithInitialIntelliSenseLoad) {
            return;
        }

        var currentSnapshot = this._composeSnippetFromEditor();
        if (currentSnapshot == null) {
            return;
        }

        var newIntelliSenseDefinitions = currentSnapshot.getTypeScriptDefinitions();
        if (!_.isEqual(this.currentIntelliSense, newIntelliSenseDefinitions)) {
            this.currentIntelliSense = newIntelliSenseDefinitions;
            this.tabs.initiateLoadIntelliSense()
                .then(() => this._showStatus(StatusType.info, 4 /* seconds */,
                    'IntelliSense successfully reloaded.'))
                .catch(UxUtil.catchError('Error refreshing IntelliSense', null));
        }
    }

    back(): void {
        if (this.editMode) {
            this.editMode = false;
            return;
        }

        const navigateHomeAction = () => this._router.navigate(['new']);

        if (this._haveUnsavedModifications) {
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
        appInsights.trackEvent('Refresh', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        if (this._haveUnsavedModifications) {
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
        appInsights.trackEvent('Share', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        const navigateToShareAction = () => this._router.navigate(['share', this.snippet.meta.id]);

        if (this._haveUnsavedModifications) {
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
        appInsights.trackEvent('Save', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        return this._saveHelper()
            .then((snippet) => {
                this._showStatus(StatusType.info, 3 /*seconds*/, `Saved "${snippet.meta.name}"`);
            })
            .catch(this._errorHandler);
    }

    private _saveHelper(): Promise<Snippet> {
        return this._validateNameBeforeProceeding().then(() => {
            var currentSnapshot = this._composeSnippetFromEditor();
            if (currentSnapshot == null) {
                throw new PlaygroundError("Error while saving: could not retrieve current snippet state");
            }

            this.snippet = currentSnapshot;
            return this._snippetManager.save(this.snippet);
        });
    }

    delete(): Promise<void> {
        appInsights.trackEvent('Delete from Editor', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        return this._snippetManager.delete(this.snippet, true /*askForConfirmation*/)
            .then(() => {
                this._router.navigate(['new']);
            })
            .catch(this._errorHandler);
    }

    run(): Promise<any> {
        appInsights.trackEvent('Run from Editor', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        return this._validateNameBeforeProceeding()
            .then(() => {
                if (this._haveUnsavedModifications) {
                    return this._saveHelper();
                }
            })
            .then(() => this._router.navigate(['run', this.snippet.meta.id, true /*returnToEdit*/]))
            .catch(this._errorHandler);
    }

    duplicate(): Promise<void> {
        return UxUtil.showDialog("Duplicate snippet?", "Would you like to save the current editor state into a new snippet?", ['Yes', 'Cancel'])
            .then(choice => {
                if (choice !== 'Yes') {
                    throw new ExpectedError();
                }
            })
            .then(() => {
                appInsights.trackEvent('Duplicate', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

                return this._validateNameBeforeProceeding()
                    .then(() => {
                        var currentSnapshot = this._composeSnippetFromEditor();
                        if (currentSnapshot == null) {
                            throw new PlaygroundError("Error while duplicating snippet: could not retrieve current snippet state");
                        }

                        return this._snippetManager.duplicate(currentSnapshot);
                    })
                    .then(duplicateSnippet => {
                        this._router.navigate(['edit', duplicateSnippet.meta.id]);
                        return duplicateSnippet
                    })
                    .then((duplicateSnippet) => {
                        this._showStatus(StatusType.info, 3 /*seconds*/, 'Created duplicate snippet');
                        this._showNameFieldAndSetFocus();
                    })
                    .catch(this._errorHandler);
            })
            .catch(UxUtil.catchError("Error duplicating snippet", null));
    }

    /**
     * Shows a status message. If seconds is <= 0, will show message for indefinite amount of time
     */
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

        if (seconds > 0) {
            this._timeout = setTimeout(() => {
                clearTimeout(this._timeout);
                this.clearStatus();
            }, seconds * 1000);
        }
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
        appInsights.trackEvent('Popout Editor', { type: 'UI Action', id: this.snippet.meta.id, name: this.snippet.meta.name });

        var dialogOptions = { displayInIFrame: true, width: 85, height: 85 };
        var url = Utilities.playgroundBasePath + 'addin/';

        if (!Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
            UxUtil.showDialog("Dialog not supported",
                "Launching a standalone-editor dialog window is not supported on this platform yet.", "OK")
            return;
        }

        Office.context.ui.displayDialogAsync(url, dialogOptions, function (result) {
            if (result.status !== Office.AsyncResultStatus.Succeeded) {
                UxUtil.showDialog("Error launching dialog", [
                    "Could not create a standalone-editor dialog window.",
                    "Error details: " + result.error.message
                ], "OK");
            }

            var dialog = result.value;
            dialog.addEventHandler("DialogMessageReceived", function (e) {
                UxUtil.showDialog("Event received", Utilities.stringifyPlusPlus(e), "OK");
            });
        });
    }

    get isOfficeSnippet() {
        return this.snippet.containsOfficeJsReference;
    }

    private _errorHandler(e: any): void {
        if (e instanceof ExpectedError) {
            this.clearStatus();
            return;
        } else if (e instanceof PlaygroundError) {
            var message: string;
            if (_.isString(e.message)) {
                message = e.message as string;
            } else if (_.isArray(e.message)) {
                message = (e.message as string[]).join(" \n");
            }
            this._showStatus(StatusType.error, 5 /*seconds*/, message);
        } else {
            UxUtil.showErrorNotification('Error', [], e);
        }
    }

    private _composeSnippetFromEditor(): Snippet {
        var currentEditorState = this.tabs.currentState;

        if (currentEditorState === null) {
            return null;
        }

        return new Snippet({
            meta: this.snippet.meta,
            css: currentEditorState['CSS'],
            libraries: currentEditorState['Libraries'],
            script: currentEditorState['Script'],
            html: currentEditorState['HTML']
        });
    }

    private get _haveUnsavedModifications(): boolean {
        var currentSnapshot = this._composeSnippetFromEditor();
        if (currentSnapshot == null) {
            return false;
        }

        return this.snippet.lastSavedHash != currentSnapshot.getHash();
    }
}
