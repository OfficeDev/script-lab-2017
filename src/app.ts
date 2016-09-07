import {bootstrap} from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http';
import {Component, ExceptionHandler, enableProdMode, OnDestroy} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {Router, NavigationStart, NavigationEnd, ROUTER_DIRECTIVES} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from './app.routes';
import {MediatorService, SnippetManager} from './shared/services';
import {Utilities, ContextUtil, UxUtil, ExceptionHelper, NotificationHelper, RequestHelper, ContextType} from './shared/helpers';
import {Authenticator, TokenManager} from './shared/services/oauth';

require('./assets/styles/spinner.scss');
require('./assets/styles/globals.scss');

require('./assets/styles/excel.scss');
require('./assets/styles/word.scss');
require('./assets/styles/powerpoint.scss');
require('./assets/styles/onenote.scss');
require('./assets/styles/generic.scss');

ContextUtil.applyTheme();

if (!window.location.href.indexOf('localhost')) {
    enableProdMode();
}

export const PROVIDER_OVERRIDES = [
    { provide: ExceptionHandler, useClass: ExceptionHelper },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
];

export const APP_PROVIDERS = [
    SnippetManager,
    ExceptionHelper,
    NotificationHelper,
    RequestHelper,
    MediatorService,
    HTTP_PROVIDERS
];

@Component({
    selector: 'app',
    template: '<router-outlet></router-outlet>',
    directives: [ROUTER_DIRECTIVES]
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

export function launch() {
    $('.app .ms-ProgressIndicator-itemDescription').text('Loading the runtime...');
    bootstrap(AppComponent, [
        ...APP_ROUTER_PROVIDERS,
        ...PROVIDER_OVERRIDES,
        ...APP_PROVIDERS
    ])
        .catch(UxUtil.catchError("Error", "An error occurred while loading the playground"));
}

if (!window['Office']) {
    window['Office'] = {};
}
Office.initialize = function () {
    console.log('Office.initialize completed.');

    // Note: due to existing bug, this is not safe to call as is right now, need to check for requirements.
    // However, given some of the other pending issues with the dialogs (no support on Online,
    // inability to execute OM code from within the dialog) just disabling the dialog functionality for now.
    // if (Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
    // TODO (Bhargav): make this work.  For now just always showing by default regardless of host.
    // $('.display-if-office-js-dialog-enabled').show();
    // }

    ContextUtil.setGlobalState(ContextUtil.windowkey_officeInitialized, true);
};

if (!Authenticator.isDialog) launch();