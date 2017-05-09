import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet, GitHub } from '../actions';
import { UIEffects } from '../effects/ui';
import { Strings, environment } from '../helpers';

@Component({
    selector: 'app',
    template: `
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command icon="GlobalNavButton" (click)="showMenu()"></command>
                <command class="title" [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name" (click)="showInfo=true"></command>
                <command [hidden]="isAddinCommands||isEmpty" icon="Play" [async]="running$|async" title="${Strings.run}" (click)="run()"></command>
                <command [hidden]="isEmpty||!isAddinCommands" icon="Play" [async]="running$|async" title="${Strings.run}">
                    <command icon="Play" title="${Strings.runInThisPane}" [async]="running$|async" (click)="run()"></command>
                    <command icon="OpenPaneMirrored" title="${Strings.runSideBySide}" (click)="runSideBySide()"></command>
                </command>
                <command [hidden]="isEmpty" icon="Share" [async]="sharing$|async" title="${Strings.share}">
                    <command icon="PageCheckedin" title="${Strings.shareMenuPublic}" (click)="shareGist(true)"></command>
                    <command icon="ProtectedDocument" title="${Strings.shareMenuPrivate}" (click)="shareGist(false)"></command>
                    <command id="CopyToClipboard" icon="Copy" title="${Strings.shareMenuClipboard}" (click)="shareCopy()"></command>
                    <command icon="Download" title="${Strings.shareMenuExport}" (click)="shareExport()"></command>
                </command>
                <command [hidden]="isEmpty" icon="Delete" title="${Strings.delete}" (click)="delete()"></command>
                <command [hidden]="isLoggedIn$|async" [async]="profileLoading$|async" icon="AddFriend" title="${Strings.loginGithub}" (click)="login()"></command>
                <command [hidden]="!(isLoggedIn$|async)" [title]="(profile$|async)?.login" [image]="(profile$|async)?.avatar_url" (click)="showProfile=true"></command>
            </header>
            <editor></editor>
            <footer class="command__bar command__bar--condensed">
                <command icon="Info" title="About" (click)="showAbout=true"></command>
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

    constructor(
        private _store: Store<fromRoot.State>,
        private _effects: UIEffects
    ) {
        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });

        this._store.dispatch(new GitHub.IsLoggedInAction());
    }

    get isAddinCommands() {
        return /commands=1/ig.test(location.search);
    }

    menuOpened$ = this._store.select(fromRoot.getMenu);

    theme$ = this._store.select(fromRoot.getTheme)
        .map(isLight => isLight ? Strings.lightTheme : Strings.darkTheme);

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

        this._store.dispatch(new Snippet.RunAction(this.snippet));
    }

    runSideBySide() {
        this._store.dispatch(new UI.ShowAlertAction({
            actions: [ Strings.SideBySideInstructions.gotIt ],
            title: Strings.SideBySideInstructions.title,
            message: Strings.SideBySideInstructions.message
        }));
    }

    async delete() {
        if (this.snippet == null) {
            return;
        }

        let result = await this._effects.alert(Strings.deleteSnippetConfirm, `${Strings.delete} ${this.snippet.name}`, Strings.delete, Strings.cancelButtonLabel);
        if (result === Strings.cancelButtonLabel) {
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

    shareGist(isPublic: boolean) {
        if (this.snippet == null) {
            return;
        }

        let sub = this.isLoggedIn$
            .subscribe(isLoggedIn => {
                if (!isLoggedIn) {
                    this._store.dispatch(new GitHub.LoginAction());
                    return;
                }

                if (isPublic) {
                    this._store.dispatch(new GitHub.SharePublicGistAction(this.snippet));
                }
                else {
                    this._store.dispatch(new GitHub.SharePrivateGistAction(this.snippet));
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
                this._effects.alert(data, 'Errors', 'Dismiss')
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
