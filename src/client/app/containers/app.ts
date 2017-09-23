import { Component } from '@angular/core';

@Component({
    selector: 'app',
    template: `
    <router-outlet></router-outlet>
    `
})

/*
* An otherwise empty Angular component that contains a router-outlet to direct where to load the appropriate component into the app.
* Based on the route, either the editor (editor.mode.ts) or view (view.mode.ts) mode will be loaded.
*/
export class AppComponent {}
