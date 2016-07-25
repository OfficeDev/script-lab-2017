import {Component} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {APP_ROUTER_PROVIDERS} from "./app.routes";

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    directives: [ROUTER_DIRECTIVES]
})

export class AppComponent { }

bootstrap(AppComponent, [APP_ROUTER_PROVIDERS]);