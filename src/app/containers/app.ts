import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme, Utilities as Utils } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI, Snippet } from '../actions';
import { UIEffects } from '../effects/ui';
import { CONFIG } from '../../environment';

@Component({
    selector: 'app',
    template: `
        <hamburger [open]="menuOpened$" (dismiss)="hideMenu()">
            <gallery-view></gallery-view>
        </hamburger>
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command [hidden]="menuOpened$|async" icon="GlobalNavButton" (click)="showMenu()"></command>
                <command [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Play" title="Run"></command>
                <command [hidden]="isEmpty || !(readonly$|async)" icon="Add" title="Add to my snippets" (click)="create()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Save" title="Save" (click)="save()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Share" title="Share"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Copy" title="Duplicate" (click)="duplicate()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Delete" title="Delete" (click)="delete()"></command>
                <command [hidden]="isEmpty || (readonly$|async)" icon="Contact" title="Profile"></command>
            </header>
            <router-outlet></router-outlet>
            <footer class="command__bar command__bar--condensed">
                <command icon="Info" title="About" (click)="about()"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
                <command icon="StatusErrorFull" [title]="(errors$|async)?.length"></command>
                <command class="language" [title]="language$|async"></command>
            </footer>
        </main>
        <dialog [show]="dialog$|async"></dialog>
    `
})

export class AppComponent {
    dialog$: Observable<IDialog>;
    theme$: Observable<string>;
    errors$: Observable<Error[]>;
    language$: Observable<string>;
    readonly$: Observable<boolean>;
    menuOpened$: Observable<boolean>;

    snippet: ISnippet;
    isEmpty: boolean;

    constructor(
        private _store: Store<fromRoot.State>,
        private _router: Router,
        private _effects: UIEffects
    ) {
        this.dialog$ = this._store.select(fromRoot.getDialog);

        this.readonly$ = this._store.select(fromRoot.getReadOnly);

        this.menuOpened$ = this._store.select(fromRoot.getMenu);

        this.theme$ = this._store.select(fromRoot.getTheme)
            .map(isLight => isLight ? 'Light' : 'Dark');

        this.language$ = this._store.select(fromRoot.getLanguage);

        this.errors$ = this._store.select(fromRoot.getErrors);

        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.isEmpty = snippet == null;
            this.snippet = snippet;
        });
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

    create() {
        if (this.snippet == null) {
            return;
        }
        this._store.dispatch(new Snippet.CreateAction(this.snippet));
    }

    changeTheme() {
        this._store.dispatch(new UI.ChangeThemeAction());
    }

    dismiss(action: string) {
        console.log(action);
    }

    async about() {
        let message = `Version: ${CONFIG.build.full_version}\nDate: ${new Date(CONFIG.build.build)}\n\nUsage:\n${Utils.storageSize(localStorage, Utilities.host + ' Snippets')}\n${Utils.storageSize(sessionStorage, 'IntellisenseCache')}`;

        let result = await this._effects.showDialog({
            title: 'Add-in Playground',
            message: message,
            actions: ['Ok']
        });
    }
}
