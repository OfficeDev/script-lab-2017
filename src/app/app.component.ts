import {Component} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from "./app.routes";

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    directives: [ROUTER_DIRECTIVES]
})

export class AppComponent { }

bootstrap(AppComponent, [
    APP_ROUTER_PROVIDERS,
    {provide: LocationStrategy, useClass: HashLocationStrategy}
]);