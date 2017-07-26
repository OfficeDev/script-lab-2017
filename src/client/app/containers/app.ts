import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet, GitHub } from '../actions';
import { UIEffects } from '../effects/ui';
import { environment, isOfficeHost, isInsideOfficeApp } from '../helpers';
import { Strings } from '../strings';
import { isEmpty } from 'lodash';

@Component({
    selector: 'app',
    template: `
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command icon="GlobalNavButton" (click)="showMenu()"></command>
                <command class="title" [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name" (click)="showInfo=true"></command>
                <command [hidden]="isAddinCommands||isEmpty" icon="Play" [async]="running$|async" title="{{strings.run}}" (click)="run()"></command>
                <command [hidden]="isEmpty||!isAddinCommands" icon="Play" [async]="running$|async" title="{{strings.run}}">
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
    `
})

export class AppComponent {
    snippet: ISnippet;
    isEmpty: boolean;
    isDisabled: boolean;

    strings = Strings();

    constructor(
        private _store: Store<fromRoot.State>,
        private _effects: UIEffects
    ) {
        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });

        this._store.select(fromRoot.getSharing).subscribe(sharing => {
            this.isDisabled = sharing;
        });

        this._store.dispatch(new GitHub.IsLoggedInAction());
    }

    get isAddinCommands() {
        return /commands=1/ig.test(location.search);
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

    run() {
        if (this.snippet == null) {
            return;
        }

        if (isOfficeHost(this.snippet.host)) {
            if (!isInsideOfficeApp()) {
                this._store.dispatch(new UI.ShowAlertAction({
                    actions: [this.strings.okButtonLabel],
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

        let result = await this._effects.alert(this.strings.deleteSnippetConfirm, `${this.strings.delete} ${this.snippet.name}`, this.strings.delete, this.strings.cancelButtonLabel);
        if (result === this.strings.cancelButtonLabel) {
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
                        confirmationAlertIfAny = await this._effects.alert(this.strings.sharePublicSnippetConfirm, `${this.strings.share} ${this.snippet.name}`, this.strings.share, this.strings.cancelButtonLabel);
                    }

                    if (confirmationAlertIfAny !== this.strings.cancelButtonLabel) {
                        this._store.dispatch(new GitHub.SharePublicGistAction(this.snippet));
                    }

                    this.isDisabled = false;
                }
                else {
                    if (isGistOwned && this.snippet.gist) {
                        confirmationAlertIfAny = await this._effects.alert(this.strings.sharePrivateSnippetConfirm, `${this.strings.share} ${this.snippet.name}`, this.strings.share, this.strings.cancelButtonLabel);
                    }

                    if (confirmationAlertIfAny !== this.strings.cancelButtonLabel) {
                        this._store.dispatch(new GitHub.SharePrivateGistAction(this.snippet));
                    }

                    this.isDisabled = false;
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
        this.errors$
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
}
