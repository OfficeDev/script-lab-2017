import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { UxUtil, Utilities, Theme, ContextTypes } from '../helpers';
import { SnippetManager } from '../../shared/services';

export class BaseComponent {
    private _subscriptions: Subscription[] = [];

    constructor(
        protected _router: Router,
        protected _snippetManager: SnippetManager
    ) {
        // Clear out any dialog that may have been left there from a previous page.
        UxUtil.hideDialog();
    }

    protected markDispose(subscription: Subscription[])
    protected markDispose(subscription: Subscription)
    protected markDispose(subscription: any) {
        if (Array.isArray(subscription)) {
            this._subscriptions = this._subscriptions.concat(subscription);
        }
        else if (subscription instanceof Subscription) {
            this._subscriptions.push(subscription);
        }
    }

    ngOnDestroy() {
        _.each(this._subscriptions, subscription => {
            subscription.unsubscribe();
        });

        this._subscriptions = [];
    }
}
