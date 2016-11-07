import { Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Tab, Tabs, IEditorParent } from '../shared/components';
import { BaseComponent } from '../shared/components/base.component';
import { Snippet, SnippetManager } from '../shared/services';
import { Utilities, Theme, ContextTypes, MessageStrings, ExpectedError, PlaygroundError, UxUtil } from '../shared/helpers';

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
    @ViewChild(Tabs) tabs: Tabs;
    @ViewChild('name') nameInputField: ElementRef;

    private _doneWithInitialIntelliSenseLoad = false;
    private _timeout;

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);
        this._snippetManager.new().then(snippet => this.snippet = snippet);
        this._errorHandler = this._errorHandler.bind(this);
    }

    ngOnInit() {
        this.tabs.editorParent = this;

        let subscription = this._route.params.subscribe(params => {
            if (params['id'] == null) {
                return;
            }
            else {
                this._snippetManager.find(params['id'])
                    .then(snippet => {
                        this.snippet = snippet;
                        this.currentIntelliSense = snippet.typings;
                        this._showStatus(StatusType.warning, -1 /* seconds. negative = indefinite */, 'Loading IntelliSense...');
                        return this.tabs.initiateLoadIntelliSense();
                    })
                    .then(() => {
                        this.clearStatus();
                        this._doneWithInitialIntelliSenseLoad = true;
                    })
                    .catch(UxUtil.catchError('An error occurred while loading IntelliSense.', []))
                    .catch(this._errorHandler);
            }
        });

        this.markDispose(subscription);

        this.tabs.setSaveAction(() => {
            this.save();
        });
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

        let currentSnapshot = this._composeSnippetFromEditor();
        if (currentSnapshot == null) {
            return;
        }

        let newIntelliSenseDefinitions = currentSnapshot.typings;
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
            UxUtil.showDialog('Save the snippet?', `Save the snippet "${this.snippet.content.name}" before going back?`, ['Yes', 'No', 'Cancel'])
                .then((choice) => {
                    if (choice === 'Cancel') {
                        return;
                    }
                    else if (choice === 'Yes') {
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
        appInsights.trackEvent('Refresh', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

        if (this._haveUnsavedModifications) {
            UxUtil.showDialog('Save the snippet?', `Save the snippet "${this.snippet.content.name}" before re-loading the page?`, ['Save', 'Discard Changes'])
                .then((choice) => {
                    if (choice === 'Save') {
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
        appInsights.trackEvent('Share', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

        const navigateToShareAction = () => this._router.navigate(['share', this.snippet.content.id]);

        if (this._haveUnsavedModifications) {
            UxUtil.showDialog('Save the snippet?', `You must save the snippet before sharing it. Save it now?`, ['Save and proceed', 'Cancel'])
                .then((choice) => {
                    if (choice === 'Save and proceed') {
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
        if (Utilities.isEmpty(this.snippet.content.name)) {
            this._showNameFieldAndSetFocus();
            return Promise.reject(new Error(MessageStrings.PleaseProvideNameForSnippet));
        }

        return Promise.resolve();
    }

    save(): Promise<void> {
        appInsights.trackEvent('Save', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

        return this._saveHelper()
            .then((snippet) => {
                this._showStatus(StatusType.info, 3 /*seconds*/, `Saved "${snippet.name}"`);
            })
            .catch(this._errorHandler);
    }

    private _saveHelper(): Promise<ISnippet> {
        return this._validateNameBeforeProceeding().then(() => {
            let currentSnapshot = this._composeSnippetFromEditor();
            if (currentSnapshot == null) {
                throw new PlaygroundError('Error while saving: could not retrieve current snippet state');
            }

            this.snippet = currentSnapshot;
            return this._snippetManager.save(this.snippet);
        });
    }

    delete(): Promise<void> {
        appInsights.trackEvent('Delete from Editor', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

        return this._snippetManager.delete(this.snippet, true /*askForConfirmation*/)
            .then(() => {
                this._router.navigate(['new']);
            })
            .catch(this._errorHandler);
    }

    run() {
        appInsights.trackEvent('Run from Editor', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });
        return this._validateNameBeforeProceeding()
            .then(() => {
                if (this._haveUnsavedModifications) {
                    return this._saveHelper();
                }
            })
            .then(() => {
                this.post('https://office-playground-runner.azurewebsites.net', { snippet: JSON.stringify(this.snippet.content) });
            })
            .catch(this._errorHandler);
    }

    duplicate(): Promise<void> {
        return UxUtil.showDialog('Duplicate snippet?', 'Would you like to save the current editor state into a new snippet?', ['Yes', 'Cancel'])
            .then(choice => {
                if (choice !== 'Yes') {
                    throw new ExpectedError();
                }
            })
            .then(() => {
                appInsights.trackEvent('Duplicate', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

                return this._validateNameBeforeProceeding()
                    .then(() => {
                        let currentSnapshot = this._composeSnippetFromEditor();
                        if (currentSnapshot == null) {
                            throw new PlaygroundError('Error while duplicating snippet: could not retrieve current snippet state');
                        }

                        return this._snippetManager.copy(currentSnapshot);
                    })
                    .then(duplicateSnippet => {
                        this._router.navigate(['edit', duplicateSnippet.content.id]);
                        return duplicateSnippet;
                    })
                    .then((duplicateSnippet) => {
                        this._showStatus(StatusType.info, 3 /*seconds*/, 'Created duplicate snippet');
                        this._showNameFieldAndSetFocus();
                    })
                    .catch(this._errorHandler);
            })
            .catch(UxUtil.catchError('Error duplicating snippet', null));
    }

    /**
     * Shows a status message. If seconds is <= 0, will show message for indefinite amount of time
     */
    private _showStatus(statusType: StatusType, seconds: number, message: string): void {
        if (!(this._timeout == null)) {
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
        appInsights.trackEvent('Popout Editor', { type: 'UI Action', id: this.snippet.content.id, name: this.snippet.content.name });

        let dialogOptions = { displayInIFrame: true, width: 85, height: 85 };
        let url = Utilities.playgroundBasePath + 'addin/';

        if (!Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
            UxUtil.showDialog('Dialog not supported',
                'Launching a standalone-editor dialog window is not supported on this platform yet.', 'OK');
            return;
        }

        Office.context.ui.displayDialogAsync(url, dialogOptions, function (result) {
            if (result.status !== Office.AsyncResultStatus.Succeeded) {
                UxUtil.showDialog('Error launching dialog', [
                    'Could not create a standalone-editor dialog window.',
                    'Error details: ' + result.error.message
                ], 'OK');
            }

            let dialog = result.value;
            dialog.addEventHandler('DialogMessageReceived', function (e) {
                UxUtil.showDialog('Event received', Utilities.stringifyPlusPlus(e), 'OK');
            });
        });
    }

    private _errorHandler(e: any): void {
        if (e instanceof ExpectedError) {
            this.clearStatus();
            return;
        } else if (e instanceof PlaygroundError) {
            let message: string;
            if (_.isString(e.message)) {
                message = e.message as string;
            } else if (_.isArray(e.message)) {
                message = (e.message as string[]).join(' \n');
            }
            this._showStatus(StatusType.error, 5 /*seconds*/, message);
        } else {
            UxUtil.showErrorNotification('Error', [], e);
        }
    }

    private _composeSnippetFromEditor(): Snippet {
        let currentEditorState = this.tabs.currentState;

        if (currentEditorState === null) {
            return null;
        }

        return new Snippet({
            id: this.snippet.content.id,
            name: this.snippet.content.name,
            style: currentEditorState['CSS'],
            libraries: currentEditorState['Libraries'],
            script: currentEditorState['Script'],
            template: currentEditorState['HTML']
        });
    }

    private get _haveUnsavedModifications(): boolean {
        let currentSnapshot = this._composeSnippetFromEditor();
        if (currentSnapshot == null) {
            return false;
        }

        return this.snippet.isUpdated;
    }

    post(path, params) {
        let form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', path);

        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                let hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        form.submit();
    }
}
