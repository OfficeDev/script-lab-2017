import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {ROUTER_DIRECTIVES, Router} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from "./app.routes";

@Component({
    selector: 'app',
    templateUrl: 'app.html',
    styleUrls: ['app.scss'],
    directives: [ROUTER_DIRECTIVES]
})

export class AppComponent { }

bootstrap(AppComponent, [APP_ROUTER_PROVIDERS]);