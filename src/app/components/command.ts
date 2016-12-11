import { Component, Input } from '@angular/core';

@Component({
    selector: 'command',
    template: `
        <div class="command__icon ms-u-slideLeftIn10">
            <i class="ms-Icon" [ngClass]="icon"></i>
            <span class="ms-font-m" *ngIf="!(title == null)">{{title}}</span>
        </div>
    `
})
export class Command {
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
