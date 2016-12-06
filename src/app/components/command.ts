import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'command',
    template: `
        <div class="command__icon" (click)="click.emit($event)">
            <i class="ms-Icon" [ngClass]="icon"></i>
            <span class="ms-font-m" *ngIf="title">{{title}}</span>
        </div>
    `
})
export class CommandIcon {
    @Output() click = new EventEmitter();

    private _icon: string;
    @Input()
    get icon() {
        if (this._icon) {
            return `ms-Icon--${this._icon}`;
        }
    }

    set icon(value) {
        this._icon = value;
    }

    @Input() title: string;
};
