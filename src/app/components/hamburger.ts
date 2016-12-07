import { Component, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Disposable } from '../services';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { CloseMenuAction } from '../actions/ui';

@Component({
    selector: 'hamburger',
    template: `
    <section class="hamburger-menu ms-u-slideRightIn10" [class.hamburger-menu--shown]="shown$|async">
        <div class="command__bar">
            <div class="command__icon" (click)="close()">
                <i [hidden]="!(shown$|async)" class="ms-Icon ms-Icon--Cancel"></i>
            </div>
            <div class="command__title">
                <span class="ms-font-m">{{ title || 'Add-in Playground' }}</span>
            </div>
        </div>
        <div class="hamburger-menu__container">
            <ng-content></ng-content>
        </div>
    </section>
    `
})
export class Hamburger extends Disposable {
    @Input() title: string;
    shown$: Observable<boolean>;

    constructor(private _store: Store<fromRoot.State>) {
        super();
        this.shown$ = this._store.select(fromRoot.getMenu);
    }

    close() {
        this._store.dispatch(new CloseMenuAction());
    }
}
