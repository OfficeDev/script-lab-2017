import { Component, OnInit } from '@angular/core';
import { Disposable } from '../services';

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
                        <button *ngFor="let action of actions" class="ms-Dialog-action ms-Button" (click)="execute(action)">
                            <span class="ms-Button-label">{{action}}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`
})
export class Dialog extends Disposable {
    dialog: IDialog;
    actions: string[];

    constructor() {
        super();
        // let subscription = this._notification.on<IDialog>('DialogEvent').subscribe(dialog => {
        //     if (!_.isEmpty(dialog.actions)) {
        //         this.actions = Object.keys(dialog.actions);
        //     }

        //     this.dialog = dialog;
        // });
        // this.markDispose(subscription);
    }

    execute(action: string) {
        if (!_.isFunction(this.dialog.actions[action])) {
            return;
        }

        this.dialog.actions[action](action);
        this.dialog = null;
    }
}
