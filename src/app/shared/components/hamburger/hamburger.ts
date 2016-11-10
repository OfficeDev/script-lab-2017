import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Utilities } from '../../helpers';
import { ViewBase } from '../base';
import './hamburger.scss';

@Component({
    selector: 'hamburger',
    template: `
    <section class="hamburger-menu" [ngClass]="{'hamburger-menu--shown': shown}">
        <div class="hamburger-menu__close" (click)="close()">
            <i [hidden]="!shown" class="ms-Icon ms-Icon-large ms-Icon--GlobalNavButton"></i>
            <i [hidden]="shown" class="ms-Icon ms-Icon-large ms-Icon--Cancel"></i>
        </div>
        <div class="hamburger-menu__container">
            <ng-content></ng-content>
        </div>
    </section>
    `
})
export class HamburgerComponent extends ViewBase {
    @Input() shown: boolean;
    @Output() shownChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor() {
        super();
    }

    close() {
        this.shownChanged.next(false);
    }
}
