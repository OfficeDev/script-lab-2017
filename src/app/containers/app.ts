import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostType, Storage } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme, Utilities as Utils } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet, GitHub } from '../actions';
import { UIEffects } from '../effects/ui';

@Component({
    selector: 'app',
    template: `
        <hamburger [open]="menuOpened$" (dismiss)="hideMenu()">
            <gallery></gallery>
        </hamburger>
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command [hidden]="menuOpened$|async" icon="GlobalNavButton" (click)="showMenu()"></command>
                <command class="title" [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name" (click)="showInfo=true"></command>
                <command [hidden]="isEmpty" icon="Play" [async]="running$|async" title="Run" (click)="run()"></command>
                <command [hidden]="isEmpty" icon="Share" [async]="sharing$|async" title="Share">
                    <command icon="PageCheckedin" title="Public Gist" (click)="shareGist(true)"></command>
                    <command icon="ProtectedDocument" title="Private Gist" (click)="shareGist(false)"></command>
                    <command id="CopyToClipboard" icon="Copy" title="Copy to clipboard" (click)="shareCopy()"></command>
                </command>
                <command [hidden]="isEmpty" icon="Delete" title="Delete" (click)="delete()"></command>
                <command [hidden]="isLoggedIn$|async" [async]="profileLoading$|async" icon="AddFriend" title="Sign in to GitHub" (click)="login()"></command>
                <command [hidden]="!(isLoggedIn$|async)" [title]="(profile$|async)?.login" [image]="(profile$|async)?.avatar_url" (click)="showProfile=true"></command>
            </header>
            <router-outlet></router-outlet>
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
    static settings = new Storage('playground_settings');

    snippet: ISnippet;
    isEmpty: boolean;

    constructor(
        private _store: Store<fromRoot.State>,
        private _router: Router,
        private _effects: UIEffects
    ) {
        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });

        this._store.dispatch(new GitHub.IsLoggedInAction());
    }

    settings$ = this._store
        .select(fromRoot.getSettings)
        .debounceTime(250)
        .subscribe(changes => AppComponent.settings.insert(Utilities.host.toLowerCase(), changes));

    menuOpened$ = this._store.select(fromRoot.getMenu);

    theme$ = this._store.select(fromRoot.getTheme)
        .map(isLight => isLight ? 'Light' : 'Dark');

    language$ = this._store.select(fromRoot.getLanguage);

    errors$ = this._store.select(fromRoot.getErrors);

    profile$ = this._store.select(fromRoot.getProfile);

    profileLoading$ = this._store.select(fromRoot.getProfileLoading);

    running$ = this._store.select(fromRoot.getRunning);

    isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);

    sharing$ = this._store.select(fromRoot.getSharing);

    showImport$ = this._store.select(fromRoot.getImportState);

    showMenu() {
        this._store.dispatch(new UI.OpenMenuAction());
    }

    hideMenu() {
        this._store.dispatch(new UI.CloseMenuAction());
    }

    run() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new Snippet.RunAction(this.snippet));
    }

    async delete() {
        if (this.snippet == null) {
            return;
        }

        let result = await this._effects.alert('Are you sure you want to delete this snippet?', `Delete ${this.snippet.name}`, `Yes, delete it`, 'No, keep it');
        if (result === 'No, keep it') {
            return;
        }

        this._store.dispatch(new Snippet.DeleteAction((this.snippet.id)));
    }

    duplicate() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new Snippet.DuplicateAction(this.snippet.id));
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

    shareGist(isPublic: boolean) {
        if (this.snippet == null) {
            return;
        }

        this.isLoggedIn$
            .subscribe(isLoggedIn => {
                if (!isLoggedIn) {
                    this._store.dispatch(new GitHub.LoginAction());
                }

                if (isPublic) {
                    this._store.dispatch(new GitHub.SharePublicGistAction(this.snippet));
                }
                else {
                    this._store.dispatch(new GitHub.SharePrivateGistAction(this.snippet));
                }
            });
    }

    shareCopy() {
        if (this.snippet == null) {
            return;
        }

        this._store.dispatch(new GitHub.ShareCopyGistAction(this.snippet));
    }

    showErrors() {
        this.errors$
            .filter(errors => errors && errors.length > 0)
            .subscribe(errors => {
                let data = errors.map(error => error.message).join('\n\n');
                this._effects.alert(data, 'Errors', 'Dismiss');
            });
    }

    feedback() {
        window.open('https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u');
    }
}
