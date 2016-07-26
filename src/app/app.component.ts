import {Component, ExceptionHandler} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {ROUTER_DIRECTIVES} from '@angular/router';


import {MediatorService} from '../shared/services';
import {ExceptionHelper, NotificationHelper, RequestHelper} from '../shared/helpers';

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    directives: [ROUTER_DIRECTIVES]
})

export class AppComponent {

}

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