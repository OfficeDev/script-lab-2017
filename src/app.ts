import {bootstrap} from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http';
import {Component, ExceptionHandler} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from './app.routes';
import {MediatorService, SnippetManager} from './shared/services';
import {Utilities, UxUtil, ExceptionHelper, NotificationHelper, RequestHelper, ContextType} from './shared/helpers';

require('./assets/styles/spinner.scss');
require('./assets/styles/globals.scss');

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

export class AppComponent { }

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
Office.initialize = function() {
    console.log('Office.initialize completed.');
    Utilities.officeInitialized = true;
};

// Otherwise must be opening on the web browser.
// Launch regardless, to avoid being stuck on the loading screen.
launch();
