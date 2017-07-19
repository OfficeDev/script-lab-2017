import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI } from '../actions';
import { environment } from '../helpers';
import { Strings } from '../strings';

@Component({
    selector: 'view',
    template: `
        <main [ngClass]="theme$|async">
            <editor></editor>
            <footer class="command__bar command__bar--condensed">
                <command id="feedback" [title]="Feedback" icon="Emoji2" (click)="feedback()"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
            </footer>
        </main>
        <import></import>
        <alert></alert>
    `
})


export class ViewComponent {
    strings = Strings();

    constructor(
        private _store: Store<fromRoot.State>,
    ) {
        console.log('Shashwat + host: ' + environment.current.host);
    }

    get isAddinCommands() {
        return /commands=1/ig.test(location.search);
    }

    theme$ = this._store.select(fromRoot.getTheme)
        .map(isLight => isLight ? this.strings.lightTheme : this.strings.darkTheme);

    changeTheme() {
        this._store.dispatch(new UI.ChangeThemeAction());
    }

    feedback() {
        window.open(environment.current.config.feedbackUrl);
    }
}
