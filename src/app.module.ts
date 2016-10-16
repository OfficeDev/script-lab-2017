import {NgModule, Component, enableProdMode} from '@angular/core';
import {HttpModule} from '@angular/http';
import {Routes, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {COMPONENT_DECLARATIONS}   from './app/components';
import {SERVICE_PROVIDERS, PIPES}   from './app/services';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';
import './assets/styles/excel.scss';
import './assets/styles/word.scss';
import './assets/styles/powerpoint.scss';
import './assets/styles/onenote.scss';
import './assets/styles/generic.scss';

if (process.env.ENV === 'production') {
    enableProdMode();
}

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

@NgModule({
    imports: [BrowserModule, HttpModule, FormsModule, RouterModule],
    declarations: [...COMPONENT_DECLARATIONS, ...PIPES],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS]
})
export class AppModule { }

@Component({
    selector: 'app',
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
}

platformBrowserDynamic().bootstrapModule(AppModule);

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