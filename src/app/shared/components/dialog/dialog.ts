import { Component, OnInit } from '@angular/core';
import { Mediator, EventChannel } from '../../services';
import { BaseComponent } from '../base.component';

@Component({
    selector: 'dialog',
    templateUrl: 'dialog.html'
})
export class DialogComponent extends BaseComponent {
    private _channel: EventChannel<IDialog>;
    public dialog: IDialog;

    constructor(private _mediator: Mediator) {
        super();
        this._channel = this._mediator.createEventChannel<IDialog>('ShowDialog');
        let subscription = this._channel.source$.subscribe(dialog => this.dialog = dialog);
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
