import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component, ExceptionHandler} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from './app.routes';
import {MediatorService} from '../shared/services';
import {Utilities, ExceptionHelper, NotificationHelper, RequestHelper} from '../shared/helpers';

export const PROVIDER_OVERRIDES = [
    { provide: ExceptionHandler, useClass: ExceptionHelper },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
];

export const APP_PROVIDERS = [
    ExceptionHelper,
    NotificationHelper,
    RequestHelper,
    MediatorService
];

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    directives: [ROUTER_DIRECTIVES]
})
export class AppComponent { }

export function launch(initialHmrState?: any) {
    bootstrap(AppComponent, [
        ...APP_ROUTER_PROVIDERS,
        ...PROVIDER_OVERRIDES,
        ...APP_PROVIDERS
    ])
        .catch(err => Utilities.error);
}

launch();