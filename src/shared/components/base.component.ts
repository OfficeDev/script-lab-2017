import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Rx';
import {Utilities, ContextType} from '../helpers';
import {SnippetManager} from '../../shared/services';

export class BaseComponent {
    private _subscriptions: Subscription[] = [];

    constructor(
        protected _router: Router,
        protected _snippetManager: SnippetManager
    ) {
        if (Utilities.context !== ContextType.Unknown) {
            _snippetManager.initialize();
        }
    }

    /**
     * Ensures that a context is specified (i.e., will navigate to "home" route if
     * Utilities.context === ContextType.Unknown).
     * 
     * Returns true if context is already set, false if will need to redirect.
     */
    _ensureContext(): boolean {
        if (Utilities.context === ContextType.Unknown) {
            this._router.navigate(['home']);
            return false;
        }
        
        return true;
    }

    contextTagline: string =
        (Utilities.context === ContextType.TypeScript) ?
            'TypeScript Playground' : 'Office Add-in Playground';

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