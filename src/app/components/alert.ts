import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UI } from '../actions';

@Component({
    selector: 'alert',
    template: `
        <dialog [title]="dialog?.title" [show]="!(dialog==null)">
            <div class="ms-Dialog-content">
                <pre class="ms-Dialog-subText">{{ dialog?.message }}</pre>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button *ngFor="let action of dialog?.actions" class="ms-Dialog-action ms-Button" (click)="dismiss(action)">
                        <i class="ms-Icon" [hidden]="!(action?.icon)" [ngClass]="'ms-Icon--'+action?.icon"></i>
                        <span class="ms-Button-label">{{action.name}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})
export class Alert {
    @Input('show') dialog: IAlert;

    constructor(private _store: Store<fromRoot.State>) {

    }

    dismiss(action: string) {
        this._store.dispatch(new UI.DismissAlertAction(action));
    }
}
