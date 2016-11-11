import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Utilities } from '../../helpers';
import { ViewBase } from '../base';
import './hamburger.scss';

@Component({
    selector: 'hamburger',
    template: `
    <section class="hamburger-menu" [ngClass]="{ 'hamburger-menu--shown': shown }">
        <div class="command__bar">
            <div class="command__icon" (click)="close()">
                <i [hidden]="!shown" class="ms-Icon ms-Icon--Cancel"></i>
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
export class HamburgerComponent extends ViewBase {
    @Input() title: string;
    @Input() shown: boolean = false;
    @Output() shownChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor() {
        super();
    }

    close() {
        this.shown = false;
        this.shownChange.emit(false);
    }
}
