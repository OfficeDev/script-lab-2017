import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, Theme, ContextTypes } from './shared/helpers';

@Component({
    selector: 'app',
    template: '<router-outlet></router-outlet>'
})

export class AppComponent {

    constructor(router: Router) {
        let pagesViewedInSession = 1;
        router.events.subscribe(next => {
            let url = next.url;

            if (next instanceof NavigationStart) {
                if (Utilities.isEmpty(url)) {
                    return;
                }
                let name = url.split('/')[1];

                if (appInsights && appInsights.startTrackPage && _.isFunction(appInsights.startTrackPage)) {
                    appInsights.startTrackPage(name);
                }
            }
            else if (next instanceof NavigationEnd) {
                if (Utilities.isEmpty(url)) {
                    return;
                }

                let name = url.split('/')[1];

                if (appInsights && appInsights.stopTrackPage && _.isFunction(appInsights.stopTrackPage)) {
                    appInsights.stopTrackPage(
                        name,
                        url,
                        { mode: ContextTypes[Utilities.context] },
                        { pagesViewedInSession: pagesViewedInSession++ }
                    );
                }
            }
        });
    }
}
