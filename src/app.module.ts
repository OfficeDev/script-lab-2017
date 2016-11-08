import { NgModule, Component, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator } from '@microsoft/office-js-helpers';

import { COMPONENT_DECLARATIONS } from './app/components';
import { SERVICE_PROVIDERS } from './app/shared/services';
import { Theme, UxUtil, EXCEPTION_PROVIDER, NotificationHelper } from './app/shared/helpers';
import { APP_ROUTES } from './app.routes';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';

@Component({
    selector: 'app',
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
}

@NgModule({
    imports: [BrowserModule, HttpModule, FormsModule, APP_ROUTES],
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER, NotificationHelper]
})
export class AppModule { }

export function start() {
    if (!Authenticator.isAuthDialog()) {
        if (!window.location.href.indexOf('localhost')) {
            enableProdMode();
        }

        Theme.applyTheme().then(result => {
            $('.app .ms-ProgressIndicator-itemDescription').text('Loading the runtime...');

            platformBrowserDynamic()
                .bootstrapModule(AppModule)
                .catch(UxUtil.catchError('Error', 'An error occurred while loading the playground'));
        });
    }
}

(() => {
    //TODO: Add modernizr check for Crypto
    let isRunningInWeb = location.href.indexOf('mode=web') > 0;
    isRunningInWeb ? start() : Office.initialize = reason => start();
})();
