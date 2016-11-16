import { Component, OnInit } from '@angular/core';
import { Mediator } from '../../services';
import { ViewBase } from '../base';

@Component({
    selector: 'dialog',
    templateUrl: 'dialog.html'
})
export class Dialog extends ViewBase {
    dialog: IDialog;
    actions: string[];

    constructor(private _mediator: Mediator) {
        super();
        let subscription = this._mediator.on<IDialog>('DialogEvent').subscribe(dialog => {
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
