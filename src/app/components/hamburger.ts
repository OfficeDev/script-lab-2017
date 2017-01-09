import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'hamburger',
    template: `
    <section class="hamburger-menu ms-u-slideRightIn10" [class.hamburger-menu--shown]="open|async">
        <header class="command__bar">
            <command [hidden]="!(open|async)" icon="Cancel" (click)="dismiss.emit()"></command>
            <command class="title" title="PLAYGROUND EDITOR"></command>
        </header>
        <div class="hamburger-menu__container">
            <ng-content></ng-content>
        </div>
    </section>
    `
})
export class Hamburger {
    @Input() open: Observable<boolean>;
    @Output() dismiss = new EventEmitter();
}
