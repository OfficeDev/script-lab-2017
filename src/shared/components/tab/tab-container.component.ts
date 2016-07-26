import {Component, Input, OnInit} from '@angular/core';
import {Tab} from './tab.component';
import {Dictionary} from '../../helpers';

@Component({
    selector: 'tabs',
    template: `
    <ul class="tabs ms-Pivot ms-Pivot--tabs">
        <li class="tabs__tab ms-Pivot-link" *ngFor="let tab of values()" (click)="select(tab)" [ngClass]="{'is-selected tabs__tab--active': tab.active}">
            {{tab.alias||tab.name}}
        </li>
    </ul>
    <ng-content></ng-content>
    `,
    styleUrls: ['tab.component.scss']
})
export class Tabs extends Dictionary<Tab> {
    constructor() {
        super();
    }

    add(name:string, tab: Tab) {
        if (this.count == 0) {
            tab.active = true;
        }
        return super.add(tab.name, tab);
    }

    select(tab: Tab) {
        this.values().forEach(tab => tab.active = false);
        tab.active = true;
    }
}