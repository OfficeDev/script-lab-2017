import { Component, OnInit } from '@angular/core';
import { Notification, Disposable } from '../../services';

@Component({
    selector: 'dialog',
    templateUrl: 'dialog.html'
})
export class Dialog extends Disposable {
    dialog: IDialog;
    actions: string[];

    constructor(private _notification: Notification) {
        super();
        let subscription = this._notification.on<IDialog>('DialogEvent').subscribe(dialog => {
            if (!_.isEmpty(dialog.actions)) {
                this.actions = Object.keys(dialog.actions);
            }

            this.dialog = dialog;
        });
        this.markDispose(subscription);
    }

    execute(action: string) {
        if (!_.isFunction(this.dialog.actions[action])) {
            return;
        }

        this.dialog.actions[action](action);
        this.dialog = null;
    }
}
