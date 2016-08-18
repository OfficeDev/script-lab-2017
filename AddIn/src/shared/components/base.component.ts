import {Subscription} from 'rxjs/Rx';
import {Utilities, ContextType} from '../helpers';

export class BaseComponent {
    private _subscriptions: Subscription[] = [];

    contextTagline: string =
        (Utilities.context === ContextType.Web) ?
            'TypeScript Playground' : 'Office.js API Playground';

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