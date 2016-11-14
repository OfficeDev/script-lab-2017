import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme } from './app/shared/helpers';

@Component({
    selector: 'app',
    template: `
        <router-outlet></router-outlet>
        <dialog></dialog>
    `
})

export class AppComponent {

    constructor(router: Router) {
        let pagesViewedInSession = 1;
        router.events.subscribe(next => {
            let url = next.url;

            if (next instanceof NavigationStart) {
                if (_.isEmpty(url)) {
                    return;
                }
                let name = url.split('/')[1];

                if (appInsights && appInsights.startTrackPage && _.isFunction(appInsights.startTrackPage)) {
                    appInsights.startTrackPage(name);
                }
            }
            else if (next instanceof NavigationEnd) {
                if (_.isEmpty(url)) {
                    return;
                }

                let name = url.split('/')[1];

                if (appInsights && appInsights.stopTrackPage && _.isFunction(appInsights.stopTrackPage)) {
                    appInsights.stopTrackPage(
                        name,
                        url,
                        { mode: HostTypes[Utilities.host] },
                        { pagesViewedInSession: pagesViewedInSession++ }
                    );
                }
            }
        });
    }
}
