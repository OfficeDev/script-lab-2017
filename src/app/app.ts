import {Component, OnDestroy} from '@angular/core';
import {Router, NavigationStart, NavigationEnd} from '@angular/router';
import {Utilities, ContextUtil, ContextType} from './shared/helpers';

@Component({
    selector: 'app',
    template: '<router-outlet></router-outlet>'
})

export class AppComponent implements OnDestroy {
    private subscription;

    constructor(router: Router) {
        var pagesViewedInSession = 1;
        this.subscription = router.events.subscribe(next => {
            if (next instanceof NavigationStart) {
                if (Utilities.isEmpty(next.url)) return;
                var name = next.url.split('/')[1];

                if (appInsights && appInsights.startTrackPage && _.isFunction(appInsights.startTrackPage)) {
                    appInsights.startTrackPage(name);
                }
            }
            else if (next instanceof NavigationEnd) {
                if (Utilities.isEmpty(next.url)) return;
                var name = next.url.split('/')[1];

                if (appInsights && appInsights.stopTrackPage && _.isFunction(appInsights.stopTrackPage)) {
                    appInsights.stopTrackPage(
                        name,
                        next.url,
                        { mode: ContextType[ContextUtil.context] },
                        { pagesViewedInSession: pagesViewedInSession++ }
                    );
                }
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}