import { NgModule, Component, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator } from '@microsoft/office-js-helpers';

import { SERVICE_PROVIDERS, Monaco } from './app/shared/services';
import { EXCEPTION_PROVIDER, Theme } from './app/shared/helpers';
import { APP_ROUTES, COMPONENT_DECLARATIONS } from './app.routes';
import { AppComponent } from './app';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';

@NgModule({
    imports: [BrowserModule, HttpModule, FormsModule, APP_ROUTES],
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    constructor(monaco: Monaco) {
        monaco.initialize();
    }
}

export function start() {
    if (!Authenticator.isAuthDialog()) {
        if (!window.location.href.indexOf('localhost')) {
            enableProdMode();
        }

        Theme.applyTheme()
            .then(() => {
                platformBrowserDynamic().bootstrapModule(AppModule);
            });
    }
}

(() => {
    let isRunningInWeb = location.href.indexOf('web') > 0;
    isRunningInWeb ? start() : Office.initialize = reason => start();
})();
