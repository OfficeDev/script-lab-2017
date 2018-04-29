import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as fromRoot from '../reducers';
import { UI, Snippet, GitHub } from '../actions';
import { UIEffects } from '../effects/ui';
import { environment, isOfficeHost, isInsideOfficeApp, isMakerScript, trustedSnippetManager, navigateToRegisterCustomFunctions } from '../helpers';
import { Request, ResponseTypes } from '../services';
import { Strings } from '../strings';
import { isEmpty } from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { isCustomFunctionScript } from '../../../server/core/snippet.helper';
const { localStorageKeys } = PLAYGROUND;

@Component({
    selector: 'editor-mode',
    template: `
    <main [ngClass]="theme$|async">
        <header class="command__bar">
            <command icon="GlobalNavButton" (click)="showMenu()"></command>
            <command class="title" [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name" (click)="showInfo=true"></command>
            <command [hidden]="(isAddinCommands && !isCustomFunctionsSnippet) || isEmpty || isEditorTryIt" icon="Play" [async]="running$|async" title="{{strings.run}}" (click)="run()"></command>
            <command [hidden]="!isAddinCommands || isEmpty || isEditorTryIt || isCustomFunctionsSnippet" icon="Play" [async]="running$|async" title="{{strings.run}}">
                <command icon="Play" title="{{strings.runInThisPane}}" [async]="running$|async" (click)="run()"></command>
                <command icon="OpenPaneMirrored" title="{{strings.runSideBySide}}" (click)="runSideBySide()"></command>
            </command>
            <command [ngClass]="{'disabled': isDisabled}" [hidden]="isEmpty" icon="Share" [async]="sharing$|async" title="{{strings.share}}">
                <command *ngIf="isGistOwned|async" icon="Save" title="{{strings.updateMenu}}" (click)="shareGist({isPublic: false, isUpdate: true})"></command>
                <command icon="PageCheckedin" title="{{strings.shareMenuPublic}}" (click)="shareGist({isPublic: true, isUpdate: false})"></command>
                <command icon="ProtectedDocument" title="{{strings.shareMenuPrivate}}" (click)="shareGist({isPublic: false, isUpdate: false})"></command>
                <command id="CopyToClipboard" icon="Copy" title="{{strings.shareMenuClipboard}}" (click)="shareCopy()"></command>
                <command icon="Download" title="{{strings.shareMenuExport}}" (click)="shareExport()"></command>
            </command>
            <command [hidden]="isEmpty" icon="Delete" title="{{strings.delete}}" (click)="delete()"></command>
            <command [hidden]="isLoggedIn$|async" [async]="profileLoading$|async" icon="AddFriend" title="{{strings.loginGithub}}" (click)="login()"></command>
            <command [hidden]="!(isLoggedIn$|async)" [title]="(profile$|async)?.login" [image]="(profile$|async)?.avatar_url" (click)="showProfile=true"></command>
        </header>
        <editor></editor>
        <footer class="command__bar command__bar--condensed">
            <command icon="Info" title="{{strings.about}}" (click)="showAbout=true"></command>
            <command id="feedback" [title]="Feedback" icon="Emoji2" (click)="feedback()"></command>
            <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
            <command icon="StatusErrorFull" [title]="(errors$|async)?.length" (click)="showErrors()"></command>
            <command class="language" [title]="language$|async"></command>
        </footer>
    </main>
    <about [(show)]="showAbout"></about>
    <snippet-info [show]="showInfo" [snippet]="snippet" (dismiss)="create($event); showInfo=false"></snippet-info>
    <profile [show]="showProfile" [profile]="profile$|async" (dismiss)="logout($event); showProfile=false"></profile>
    <import [hidden]="!(showImport$|async)"></import>
    <alert></alert>
    <router-outlet></router-outlet>
    `
})

export class EditorMode {
    snippet: ISnippet;
    isEmpty: boolean;
    isDisabled: boolean;

    strings = Strings();

    private snippetSub: Subscription;
    private sharingSub: Subscription;
    private errorsSub: Subscription;

    constructor(
        private _store: Store<fromRoot.State>,
        private _effects: UIEffects,
        private _request: Request,
        private _route: ActivatedRoute
    ) {
        this.snippetSub = this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });

        this.sharingSub = this._store.select(fromRoot.getSharing).subscribe(sharing => {
            this.isDisabled = sharing;
        });

        this._store.dispatch(new GitHub.IsLoggedInAction());

        this.parseEditorRoutingParams();
    }

    get isAddinCommands() {
        return environment.current.isAddinCommands;
    }

    get isCustomFunctionsSnippet() {
        return this.snippet.script && isCustomFunctionScript(this.snippet.script.content);
    }

    get isEditorTryIt() {
        return environment.current.isTryIt;
    }

    get isGistOwned() {
        return this.profile$
            .filter(profile => (profile != null && this.snippet != null))
            .map(profile => {
                if (isEmpty(this.snippet.gist)) {
                    return false;
                }

                // Assume that user owns gist, for back-compat
                return isEmpty(this.snippet.gistOwnerId) ? true : this.snippet.gistOwnerId === profile.login;
            });
    }

    menuOpened$ = this._store.select(fromRoot.getMenu);

    theme$ = this._store.select(fromRoot.getTheme)
        .map(isLight => isLight ? this.strings.lightTheme : this.strings.darkTheme);

    language$ = this._store.select(fromRoot.getLanguage);

    errors$ = this._store.select(fromRoot.getErrors);

    profile$ = this._store.select(fromRoot.getProfile);

    profileLoading$ = this._store.select(fromRoot.getProfileLoading);

    running$ = this._store.select(fromRoot.getRunning);

    isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);

    sharing$ = this._store.select(fromRoot.getSharing);

    showImport$ = this._store.select(fromRoot.getImportState);

    ngOnDestroy() {
        if (this.snippetSub) {
            this.snippetSub.unsubscribe();
        }
        if (this.sharingSub) {
            this.sharingSub.unsubscribe();
        }
        if (this.errorsSub) {
            this.errorsSub.unsubscribe();
        }
    }

    run() {
        if (this.snippet == null) {
            return;
        }

        if (PLAYGROUND.devMode) {
            // Temporary to make it easier to load snippets despite BrowserSync issues
            if (this.isCustomFunctionsSnippet) {
                this.registerCustomFunctions();
                return;
            }
        }

        if (isOfficeHost(this.snippet.host)) {
            let canRun = isInsideOfficeApp();

            // Additionally, for a maker script:
            if (this.snippet && isMakerScript(this.snippet.script)) {
                if (!this.snippet.script.content.includes('ExcelMaker.getActiveWorkbook()')) {
                    canRun = true;
                }
            }

            if (this.isCustomFunctionsSnippet) {
                this._store.dispatch(new UI.ShowAlertAction({
                    actions: [this.strings.ok],
                    title: 'This is a Custom Functions snippet.',
                    message: 'To register your Functions, please click the Functions button in the ribbon.'
                }));
                return;
            }

            if (!canRun) {
                this._store.dispatch(new UI.ShowAlertAction({
                    actions: [this.strings.ok],
                    title: this.strings.snippetNoOfficeTitle,
                    message: this.strings.snippetNoOfficeMessage
                }));
                return;
            }
        }

        this._store.dispatch(new Snippet.RunAction(this.snippet));
    }

    runSideBySide() {
        this._store.dispatch(new UI.ShowAlertAction({
            actions: [this.strings.SideBySideInstructions.gotIt],
            title: this.strings.SideBySideInstructions.title,
            message: this.strings.SideBySideInstructions.message
        }));
    }

    async delete() {
        if (this.snippet == null) {
            return;
        }

        let result = await this._effects.alert(this.strings.deleteSnippetConfirm, `${this.strings.delete} ${this.snippet.name}`, this.strings.delete, this.strings.cancel);
        if (result === this.strings.cancel) {
            return;
        }

        this._store.dispatch(new Snippet.DeleteAction((this.snippet.id)));
    }

    create(save?: boolean) {
        if (this.snippet == null) {
            return;
        }

        if (!save) {
            return;
        }

        this._store.dispatch(new Snippet.CreateAction(this.snippet));
    }

    changeTheme() {
        this._store.dispatch(new UI.ChangeThemeAction());
    }

    logout(result: boolean) {
        if (result) {
            this._store.dispatch(new GitHub.LogoutAction());
        }
    }

    login() {
        this._store.dispatch(new GitHub.LoginAction());
    }

    showMenu() {
        this._store.dispatch(new UI.ToggleImportAction(true));
    }

    shareGist(values) {
        if (this.snippet == null) {
            return;
        }

        let sub = this.isLoggedIn$
            .subscribe(async (isLoggedIn) => {
                if (!isLoggedIn) {
                    this._store.dispatch(new GitHub.LoginAction());
                    return;
                }

                let { isPublic, isUpdate } = values;
                let isGistOwned;
                this.isGistOwned.take(1).subscribe(owned => {
                    isGistOwned = owned;
                });
                let confirmationAlertIfAny = null;
                this.isDisabled = true;

                if (isUpdate) {
                    this._store.dispatch(new GitHub.UpdateGistAction(this.snippet));
                }
                else if (isPublic) {
                    if (isGistOwned && this.snippet.gist) {
                        confirmationAlertIfAny = await this._effects.alert(this.strings.sharePublicSnippetConfirm, `${this.strings.share} ${this.snippet.name}`, this.strings.share, this.strings.cancel);
                    }

                    if (confirmationAlertIfAny !== this.strings.cancel) {
                        this._store.dispatch(new GitHub.SharePublicGistAction(this.snippet));
                    } else {
                        this.isDisabled = false;
                    }
                }
                else {
                    if (isGistOwned && this.snippet.gist) {
                        confirmationAlertIfAny = await this._effects.alert(this.strings.sharePrivateSnippetConfirm, `${this.strings.share} ${this.snippet.name}`, this.strings.share, this.strings.cancel);
                    }

                    if (confirmationAlertIfAny !== this.strings.cancel) {
                        this._store.dispatch(new GitHub.SharePrivateGistAction(this.snippet));
                    } else {
                        this.isDisabled = false;
                    }
                }

                if (sub && !sub.closed) {
                    sub.unsubscribe();
                }
            });
    }

    shareCopy() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new GitHub.ShareCopyGistAction(this.snippet));
    }

    shareExport() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new GitHub.ShareExportAction(this.snippet));
    }

    showErrors() {
        this.errorsSub = this.errors$
            .filter(errors => errors && errors.length > 0)
            .subscribe(errors => {
                let data = errors.map(error => error.message).join('\n\n');
                this._effects.alert(data, this.strings.errors, this.strings.dismiss)
                    .then(() => this._store.dispatch(new UI.DismissAllErrorsAction()));
            });
    }

    feedback() {
        window.open(environment.current.config.feedbackUrl);
    }

    noop() {
        // no-op
    }

    parseEditorRoutingParams() {
        let sub = this._route.params
            .map(params => ({ type: params.type, host: params.host, id: params.id }))
            .mergeMap(({ type, host, id }): Observable<{ valid: boolean, mode: string; id: string }> => {
                if (host && (environment.current.host.toUpperCase() !== host.toUpperCase())) {
                    environment.appendCurrent({ host: host.toUpperCase() });
                }

                if (!type) {
                    return Observable.of({ valid: true, mode: null, id: null });
                }

                switch ((type as string).toLowerCase()) {
                    case 'samples':
                        let hostJsonFile = `${environment.current.config.samplesUrl}/view/${environment.current.host.toLowerCase()}.json`;
                        return this._request.get<JSON>(hostJsonFile, ResponseTypes.JSON, true /*forceBypassCache*/)
                            .map(lookupTable => {
                                return { valid: true, mode: Snippet.ImportType.SAMPLE, id: lookupTable[id] };
                            })
                            .catch(exception => Observable.of({ valid: false, mode: null, id: null }));
                    case 'gist':
                        return Observable.of({ valid: true, mode: Snippet.ImportType.GIST, id: id });
                    case 'open':
                        return Observable.of({ valid: true, mode: Snippet.ImportType.OPEN, id: id });
                    default:
                        return Observable.of({ valid: false, mode: null, id: null });
                }
            })
            .subscribe(({ valid, mode, id }) => {
                this._processInitializationImport({ valid, mode, id });

                if (sub && !sub.closed) {
                    sub.unsubscribe();
                }
            });
    }

    _processInitializationImport(params: { valid: boolean, mode: string; id: string }): void {
        let { valid, mode, id } = params;

        const postImportCompleteMessageIfRelevant = (snippetId: string | null) => {
            if (this.isEditorTryIt) {
                window.parent.postMessage({ type: 'import-complete', id: snippetId },
                    environment.current.config.runnerUrl);
            }
        };

        // If valid, and import mode is empty, then simply let the editor be (it's just a normal open)
        if (valid && mode === null) {
            postImportCompleteMessageIfRelevant(null);
            return;
        }

        const commonImportActionParams = {
            mode: mode,
            isReadOnlyViewMode: false,
            onSuccess: (snippet: ISnippet) => {
                this._store.dispatch(new UI.ToggleImportAction(false));
                postImportCompleteMessageIfRelevant(snippet.id);
            }
        };

        switch (mode) {
            case Snippet.ImportType.SAMPLE:
                this._store.dispatch(new Snippet.ImportAction({
                    ...commonImportActionParams, saveToLocalStorage: false, data: id
                }));
                break;

            case Snippet.ImportType.GIST:
                this._store.dispatch(new Snippet.ImportAction({
                    ...commonImportActionParams, saveToLocalStorage: !this.isEditorTryIt, data: id
                }));
                break;

            case Snippet.ImportType.OPEN:
                this._store.dispatch(new Snippet.ImportAction({
                    ...commonImportActionParams, saveToLocalStorage: true, data: id
                }));
                break;

            default:
                this._store.dispatch(new UI.ReportErrorAction(Strings().failedToLoadCodeSnippet));
        }
    }

    async registerCustomFunctions() {
        if (!trustedSnippetManager.isSnippetTrusted(this.snippet.id, this.snippet.gist, this.snippet.gistOwnerId)) {
            let alertResult = await this._effects.alert(
                this.strings.snippetNotTrusted,
                this.strings.trustSnippetQuestionMark,
                this.strings.trust,
                this.strings.cancel
            );
            if (alertResult === this.strings.cancel) {
                return;
            }
        }

        let startOfRequestTime = new Date().getTime();
        window.localStorage.setItem(
            localStorageKeys.customFunctionsLastUpdatedCodeTimestamp,
            startOfRequestTime.toString()
        );

        try {
            navigateToRegisterCustomFunctions();
        } catch (e) {
            await this._effects.alert(e, 'Error registering custom functions', this.strings.ok);
        }
    }
}
