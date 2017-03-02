import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'collapse',
    template: `
        <div class="command__bar command--light" (click)="collapsed = !collapsed" *ngIf="title !== 'undefined'">
            <div class="command__title">
                <span class="ms-font-m">{{ title }}</span>
            </div>
            <div class="command__icon" *ngFor="let action of actions" (click)="clicked(action, $event)">
                <i class="ms-Icon" [ngClass]="'ms-Icon--' + action"></i>
            </div>
            <div class="command__icon">
                <i class="ms-Icon" [ngClass]="collapsed?'ms-Icon--ChevronDown':'ms-Icon--ChevronUp'"></i>
            </div>
        </div>
        <section classs="collapse__panel" [hidden]="collapsed">
            <ng-content></ng-content>
        </section>`
})
export class Collapse {
    @Input() title: string;
    @Input() collapsed: boolean;
    @Input() actions: string[];
    @Output() events: EventEmitter<any> = new EventEmitter<any>();

    clicked(action: string, $event: Event) {
        $event.stopPropagation();
        this.events.emit({
            action: action,
            title: this.title
        });
    }
}
