import { NgModule, Component, enableProdMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, Utilities } from '@microsoft/office-js-helpers';

import { SERVICE_PROVIDERS, Monaco } from './app/shared/services';
import { EXCEPTION_PROVIDER, Theme } from './app/shared/helpers';
import { APP_ROUTES, COMPONENT_DECLARATIONS } from './app.routes';
import { AppComponent } from './app';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';

declare let PLAYGROUND: any;

@NgModule({
    imports: [BrowserModule, HttpModule, FormsModule, APP_ROUTES],
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    static async start() {
        let monacoPromise = Monaco.initialize();
        console.log(location.href);
        let isAddin = location.href.indexOf('mode=web') === -1;
        if (isAddin) {
            Office.initialize = async () => {
                await monacoPromise;
                AppModule._bootstrap();
            };
        }
        else {
            await monacoPromise;
            AppModule._bootstrap();
        }
    }

    static async _bootstrap() {
        if (!Authenticator.isAuthDialog()) {
            if (PLAYGROUND.ENV === 'Production') {
                enableProdMode();
            }

            await Theme.applyTheme();
            platformBrowserDynamic().bootstrapModule(AppModule);
        }
    }
}

AppModule.start();
