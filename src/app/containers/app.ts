import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet } from '../actions';

@Component({
    selector: 'app',
    template: `
        <hamburger [title]="title" [shown]="menuOpened$|async">
            <gallery-view></gallery-view>
        </hamburger>
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command icon="GlobalNavButton" (click)="showMenu()"></command>
                <command [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="(snippet$|async)?.name"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Play" title="Run"></command>
                <command [hidden]="isEmpty || !(readonly$|async)" icon="Add" title="Add to my snippets" (click)="create()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Save" title="Save" (click)="save()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Share" title="Share"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Contact" title="Profile"></command>
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
    readonly$: Observable<boolean>;
    snippet: ISnippet;
    isEmpty: boolean;

    constructor(
        private _store: Store<fromRoot.State>,
        private _router: Router
    ) {
        this.menuOpened$ = this._store.select(fromRoot.getMenu);

        this.alert$ = this._store.select(fromRoot.getAlert);

        this.readonly$ = this._store.select(fromRoot.getReadOnly);

        this.theme$ = this._store.select(fromRoot.getTheme)
            .map(isLight => isLight ? 'Light' : 'Dark');

        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });
    }

    showMenu() {
        this._store.dispatch(new UI.OpenMenuAction());
    }

    save() {
        if (this.snippet == null) {
            return;
        }
        this._store.dispatch(new Snippet.SaveAction(this.snippet));
    }

    create() {
        if (this.snippet == null) {
            return;
        }
        this._store.dispatch(new Snippet.CreateAction(this.snippet));
    }

    changeTheme() {
        this._store.dispatch(new UI.ChangeThemeAction());
    }
}
