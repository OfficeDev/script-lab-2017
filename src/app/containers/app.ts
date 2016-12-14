import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme, Utilities as Utils } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet, GitHub } from '../actions';
import { UIEffects } from '../effects/ui';
import { Config } from '../../environment';

@Component({
    selector: 'app',
    template: `
        <hamburger [open]="menuOpened$" (dismiss)="hideMenu()">
            <gallery-view></gallery-view>
        </hamburger>
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command [hidden]="menuOpened$|async" icon="GlobalNavButton" (click)="showMenu()"></command>
                <command [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name" (click)="showInfo=true"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Play" title="Run"></command>
                <command [hidden]="isEmpty || !(readonly$|async)" icon="Add" title="Add to my snippets" (click)="showInfo=true"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Save" title="Save" (click)="save()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Share" title="Share">
                    <command [hidden]="!(isLoggedIn$|async)" icon="OpenFile" title="Public Gist"></command>
                    <command [hidden]="!(isLoggedIn$|async)" icon="ProtectedDocument" title="Private Gist"></command>
                    <command icon="Generate" title="Copy to clipboard"></command>
                </command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Copy" title="Duplicate" (click)="duplicate()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Delete" title="Delete" (click)="delete()"></command>
                <command [hidden]="isLoggedIn$|async" [async]="profileLoading$|async" icon="AddFriend" title="Sign in to GitHub" (click)="login()"></command>
                <command [hidden]="!(isLoggedIn$|async)" [title]="(profile$|async)?.login" [image]="(profile$|async)?.avatar_url" (click)="showProfile=true"></command>
            </header>
            <router-outlet></router-outlet>
            <footer class="command__bar command__bar--condensed">
                <command icon="Info" title="About" (click)="showAbout=true"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
                <command icon="StatusErrorFull" [title]="(errors$|async)?.length"></command>
                <command class="language" [title]="language$|async"></command>
            </footer>
        </main>
        <about [(show)]="showAbout"></about>
        <snippet-info [show]="showInfo" [snippet]="snippet" (dismiss)="create($event); showInfo=false"></snippet-info>
        <profile [show]="showProfile" [profile]="profile$|async" (dismiss)="logout($event); showProfile=false"></profile>
    `
})

export class AppComponent {
    theme$: Observable<string>;
    errors$: Observable<Error[]>;
    language$: Observable<string>;
    readonly$: Observable<boolean>;
    menuOpened$: Observable<boolean>;
    profile$: Observable<IProfile>;
    isLoggedIn$: Observable<boolean>;
    profileLoading$: Observable<boolean>;

    snippet: ISnippet;
    isEmpty: boolean;

    constructor(
        private _store: Store<fromRoot.State>,
        private _router: Router,
        private _effects: UIEffects
    ) {
        this.readonly$ = this._store.select(fromRoot.getReadOnly);

        this.menuOpened$ = this._store.select(fromRoot.getMenu);

        this.theme$ = this._store.select(fromRoot.getTheme)
            .map(isLight => isLight ? 'Light' : 'Dark');

        this.language$ = this._store.select(fromRoot.getLanguage);

        this.errors$ = this._store.select(fromRoot.getErrors);

        this.profile$ = this._store.select(fromRoot.getProfile);

        this.profileLoading$ = this._store.select(fromRoot.getProfileLoading);

        this.isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);

        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });

        this._store.dispatch(new GitHub.IsLoggedInAction());
    }

    showMenu() {
        this._store.dispatch(new UI.OpenMenuAction());
    }

    hideMenu() {
        this._store.dispatch(new UI.CloseMenuAction());
    }

    save() {
        if (this.snippet == null) {
            return;
        }
        this._store.dispatch(new Snippet.SaveAction(this.snippet));
    }

    delete() {
        if (this.snippet == null) {
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
}
