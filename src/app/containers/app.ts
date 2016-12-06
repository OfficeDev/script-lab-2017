import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { OpenMenuAction, ChangeThemeAction } from '../actions/ui';

@Component({
    selector: 'app',
    template: `
        <hamburger [title]="title" [shown]="menuOpened$|async">
            <gallery-view></gallery-view>
        </hamburger>
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command icon="GlobalNavButton" (click)="showMenu()"></command>
                <command icon="AppForOfficeLogo" title="Snippet 1"></command>
                <command icon="Play" title="Run"></command>
                <command icon="Save" title="Save"></command>
                <command icon="Share" title="Share"></command>
                <command icon="Contact" title="Profile"></command>
            </header>
            <router-outlet></router-outlet>
            <footer class="command__bar command__bar--condensed">
                <command icon="Info" title="About"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
                <command class="language" title="Typescript"></command>
                <command icon="StatusErrorFull" title="0"></command>
            </footer>
        </main>
        <dialog></dialog>
    `
})

export class AppComponent {
    menuOpened$: Observable<boolean>;
    alert$: Observable<IDialog>;
    theme$: Observable<string>;

    constructor(
        private _store: Store<fromRoot.State>,
        private _router: Router
    ) {
        this.menuOpened$ = this._store.select(fromRoot.getMenu);
        this.alert$ = this._store.select(fromRoot.getAlert);
        this.theme$ = this._store.select(fromRoot.getTheme)
            .map(isLight => isLight ? 'Light' : 'Dark');
    }

    showMenu() {
        this._store.dispatch(new OpenMenuAction());
    }

    changeTheme() {
        this._store.dispatch(new ChangeThemeAction());
    }
}
