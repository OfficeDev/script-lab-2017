import { Input, Component } from '@angular/core';

@Component({
    selector: 'collapse',
    template: `
        <div class="command__bar command--light" (click)="collapsed = !collapsed">
            <div class="command__title">
                <span class="ms-font-m">{{ title }}</span>
            </div>
            <div class="command__icon" *ngIf="info" (click)="infoHidden = !infoHidden; $event.stopPropagation();">
                <i class="ms-Icon ms-Icon--Info"></i>
            </div>
            <div class="command__icon">
                <i class="ms-Icon" [ngClass]="collapsed?'ms-Icon--ChevronDown':'ms-Icon--ChevronUp'"></i>
            </div>
        </div>
        <section classs="collapse__panel" [hidden]="collapsed">
            <div class="collapse__info ms-font-m" *ngIf="info" [hidden]="infoHidden">
                {{ info }}
                <br />
                <button class="ms-Button" (click)="infoHidden = !infoHidden">
                    <span class="ms-Button-label">Got it</span>
                </button>
            </div>
            <ng-content></ng-content>
        </section>`
})
export class Collapse {
    @Input() title: string;
    @Input() info: string;
}
