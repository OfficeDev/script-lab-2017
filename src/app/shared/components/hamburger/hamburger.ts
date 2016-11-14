import { Component, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { ViewBase } from '../base';
import './hamburger.scss';

@Component({
    selector: 'hamburger',
    template: `
    <section class="hamburger-menu ms-u-slideRightIn10" [ngClass]="{ 'hamburger-menu--shown': shown }">
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
export class Hamburger extends ViewBase {
    @Input() title: string;
    @Input() shown: boolean = false;
    @Output() shownChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor() {
        super();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.shown = !!changes['shown'].currentValue;
    }

    close() {
        this.shown = false;
        this.shownChange.emit(false);
    }
}
