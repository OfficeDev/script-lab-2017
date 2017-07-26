import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { UI } from '../actions';
import { PlaygroundError } from '../helpers';
import { Strings } from '../strings';
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
        .ofType(UI.UIActionTypes.DISMISS_ALERT)
        .map((action: UI.DismissAlertAction) => action.payload)
        .do(action => this._resolve(action))
        .catch(exception => {
            if (this._reject) {
                this._reject(new PlaygroundError(Strings().dialogError, exception));
            }
            return Observable.of(new UI.ReportErrorAction('Error', exception));
        });

    alert(message: string, title: string = 'Alert', ...actions: string[]) {
        let dialog = <IAlert>{
            message,
            title,
            actions
        };

        return this._showAlert(dialog);
    }

    private async _showAlert(dialog: IAlert): Promise<string> {
        try {
            let result = await new Promise<string>((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                this._store.dispatch(new UI.ShowAlertAction(dialog));
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
