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

declare var require: any;

// require.config({ paths: { 'vs': '/node_modules/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], function() {
    console.log("Monaco loaded on bootstrap");
    console.log(monaco.editor);

    bootstrap(AppComponent, [
        APP_ROUTER_PROVIDERS,
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ]);  
});
