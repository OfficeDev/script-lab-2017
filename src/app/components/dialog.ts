import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'dialog',
    template: `
    <div class="ms-Overlay" [ngClass]="{ 'is-visible': !(dialog == null) }"></div>
    <div class="ms-Dialog ms-Dialog--lgHeader ms-u-fadeIn200" [ngClass]="{ 'is-open': !(dialog == null) }">
        <div class="ms-Dialog-main">
            <div class="ms-Dialog-header">
                <p class="ms-Dialog-title">{{ dialog?.title }}</p>
            </div>
            <div class="ms-Dialog-inner">
                <div class="ms-Dialog-content">
                    <pre class="ms-Dialog-subText">{{ dialog?.message }}</pre>
                </div>
                <div class="ms-Dialog-actions">
                    <div class="ms-Dialog-actionsRight">
                        <button *ngFor="let action of dialog?.actions" class="ms-Dialog-action ms-Button" (click)="dismiss.emit(action)">
                            <span class="ms-Button-label">{{action}}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`
})
export class Dialog {
    @Input('show') dialog: IDialog;
    @Output() dismiss = new EventEmitter<string>();
}
