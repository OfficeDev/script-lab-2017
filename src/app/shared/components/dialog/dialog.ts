import { Component, OnInit } from '@angular/core';
import { Mediator, EventChannel } from '../../services';
import { ViewBase } from '../base';

@Component({
    selector: 'dialog',
    templateUrl: 'dialog.html'
})
export class Dialog extends ViewBase {
    showDialog$: EventChannel<IDialog>;
    dialog: IDialog;
    actions: string[];

    constructor(private _mediator: Mediator) {
        super();
        this.showDialog$ = this._mediator.createEventChannel<IDialog>('ShowDialog');
        let subscription = this.showDialog$.source$.subscribe(dialog => {
            this.dialog = dialog;
            if (!_.isEmpty(dialog.actions)) {
                this.actions = Object.keys(dialog.actions);
            }
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
