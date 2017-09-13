import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI } from '../actions';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'alert',
    template: `
        <dialog [title]="dialog?.title" [show]="!(dialog==null)">
            <div class="ms-Dialog-content">
                <pre class="ms-Dialog-subText">{{ dialog?.message }}</pre>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight" [ngClass]="{'multiline' : isMultiLine}">
                    <button *ngFor="let action of dialog?.actions" class="ms-Dialog-action ms-Button" (click)="dismiss(action)">
                        <span class="ms-Button-label">{{action}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})
export class Alert {
    dialog: IAlert;

    private alertSub: Subscription;

    constructor(private _store: Store<fromRoot.State>) {
        this.alertSub = this._store.select(fromRoot.getDialog).subscribe(dialog => {
            this.dialog = dialog;
        });
    }

    get isMultiLine() {
        return this.dialog && this.dialog.actions && this.dialog.actions.length > 2;
    }

    ngOnDestroy() {
        if (this.alertSub) {
            this.alertSub.unsubscribe();
        }
    }

    dismiss(action: string) {
        this._store.dispatch(new UI.DismissAlertAction(action));
    }
}
