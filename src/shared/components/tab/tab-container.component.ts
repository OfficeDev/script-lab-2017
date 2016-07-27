import {Component, Input, OnInit, ElementRef} from '@angular/core';
import {Dictionary} from '../../helpers';
import {Tab} from './tab.component';

@Component({
    selector: 'tabs',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of values()" (click)="select(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.active}">
            {{tab.alias||tab.name}}
        </li>
    </ul>
    <div class="tabs__container">
        <ng-content></ng-content>
    </div>`,
    styleUrls: ['tab.component.scss']
})
export class Tabs extends Dictionary<Tab> {
    constructor(private element: ElementRef) {
        super();
    }

    add(name: string, tab: Tab) {
        if (this.count == 0) {
            tab.activate();
        }
        return super.add(tab.name, tab);
    }

    select(tab: Tab) {
        this.values().forEach(tab => tab.deactivate());
        tab.activate();
    }
}