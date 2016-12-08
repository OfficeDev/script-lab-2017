import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Action } from '@ngrx/store';
import { UI } from '../actions';
import { PlaygroundError } from '../helpers';
import { Store } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';
import * as fromRoot from '../reducers';

@Injectable()
export class UIEffects {
    private _resolve;
    private _reject;

    constructor(
        private _store: Store<fromRoot.State>,
        private actions$: Actions
    ) {

    }

    @Effect({ dispatch: false })
    dismissDialog$ = this.actions$
        .ofType(UI.UIActionTypes.DISMISS_DIALOG)
        .map((action: UI.DismissDialogAction) => action.payload)
        .do(action => this._resolve(action))
        .catch(error => this._reject(new PlaygroundError('An error occurred in Dialog', error)));

    async showDialog(dialog: IDialog): Promise<string> {
        if (!(this._resolve == null)) {
            return Promise.reject(new PlaygroundError('A dialog is already open.'));
        }

        try {
            let result = await new Promise<string>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                this._store.dispatch(new UI.ShowDialogAction(dialog));
            });

            this._resolve = null;
            this._reject = null;
            return result;
        }
        catch (error) {
            this._resolve = null;
            this._reject = null;
            return error;
        }
    }
}
