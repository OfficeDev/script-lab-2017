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

    constructor(private _mediator: Mediator) {
        super();
        this.showDialog$ = this._mediator.createEventChannel<IDialog>('ShowDialog');
        let subscription = this.showDialog$.source$.subscribe(dialog => this.dialog = dialog);
        this.markDispose(subscription);
    }

    executeAction(isSecondary?: boolean) {
        if (isSecondary) {
            this.dialog.secondary.action();
            this.dialog = null;
        }
        else {
            this.dialog.primary.action();
            this.dialog = null;
        }
    }
}
