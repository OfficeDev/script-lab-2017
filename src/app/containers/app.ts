import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Utilities, HostTypes } from '@microsoft/office-js-helpers';
import * as _ from 'lodash';
import { Theme } from '../helpers';

@Component({
    selector: 'app',
    template: `
        <hamburger [title]="title" [shown]="true">
            <gallery-view></gallery-view>
        </hamburger>
        <main>
            <header class="command__bar">
                <command icon="GlobalNavButton"></command>
                <command icon="AppForOfficeLogo" title="Snippet 1"></command>
                <command icon="Play" title="Run"></command>
                <command icon="Save" title="Save"></command>
                <command icon="Share" title="Share"></command>
                <command icon="Contact" title="Profile"></command>
            </header>
            <router-outlet></router-outlet>
            <dialog></dialog>
        </main>
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
