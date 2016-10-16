import { NgModule, Component, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator } from '@microsoft/office-js-helpers';

import { COMPONENT_DECLARATIONS } from './app/components';
import { SERVICE_PROVIDERS } from './app/shared/services';
import { ContextUtil, UxUtil, ExceptionHelper, NotificationHelper, RequestHelper } from './app/shared/helpers';

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

export const APP_PROVIDERS = [
    ExceptionHelper,
    NotificationHelper,
    RequestHelper
];

@NgModule({
    imports: [BrowserModule, HttpModule, FormsModule, RouterModule],
    declarations: [...COMPONENT_DECLARATIONS],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, ...APP_PROVIDERS]
})
export class AppModule { }

@Component({
    selector: 'app',
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
}

export function launch() {
    if (!window['Office']) {
        window['Office'] = {};
    }

    if (Authenticator.isAuthDialog()) return;

    $('.app .ms-ProgressIndicator-itemDescription').text('Loading the runtime...');
    platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch(UxUtil.catchError("Error", "An error occurred while loading the playground"));

    Office.initialize = function () {
        // Note: due to existing bug, this is not safe to call as is right now, need to check for requirements.
        // However, given some of the other pending issues with the dialogs (no support on Online,
        // inability to execute OM code from within the dialog) just disabling the dialog functionality for now.
        // if (Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
        // TODO (Bhargav): make this work.  For now just always showing by default regardless of host.
        // $('.display-if-office-js-dialog-enabled').show();
        // }

        ContextUtil.setGlobalState(ContextUtil.windowkey_officeInitialized, true);
    };
}