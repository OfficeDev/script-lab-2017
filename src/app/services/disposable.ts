import { Subscription } from 'rxjs/Subscription';
import * as each from 'lodash/each';

export class Disposable {
    private _subscriptions: Subscription[] = [];

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
        each(this._subscriptions, subscription => {
            if (!subscription.closed) {
                subscription.unsubscribe();
            }
        });

        this._subscriptions = [];
    }
}
