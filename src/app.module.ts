import { NgModule, Component, enableProdMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, Utilities } from '@microsoft/office-js-helpers';

import { SERVICE_PROVIDERS, MonacoService } from './app/services';
import { PIPES } from './app/pipes';
import { EXCEPTION_PROVIDER, Theme } from './app/helpers';
import { APP_ROUTES, COMPONENT_DECLARATIONS } from './app.routes';
import { AppComponent } from './app/containers';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { rootReducer } from './app/reducers';
import { SnippetEffects, IntellisenseEffects } from './app/effects';
import { CONFIG } from './environment';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';


@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        APP_ROUTES,
        StoreModule.provideStore(rootReducer),
        StoreDevtoolsModule.instrumentOnlyWithExtension(),
        EffectsModule.run(SnippetEffects),
        EffectsModule.run(IntellisenseEffects)
    ],
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS, ...PIPES],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    static async start() {
        try {
            if (CONFIG.env === 'PRODUCTION') {
                enableProdMode();
            }

            await Promise.all([
                MonacoService.initialize(),
                AppModule.initialize()
            ]);

            await Theme.applyTheme();

            if (!Authenticator.isAuthDialog()) {
                platformBrowserDynamic().bootstrapModule(AppModule);
            }
        }
        catch (e) {
            Utilities.log(e);
        }
    }

    static initialize() {
        return new Promise<boolean>(resolve => {
            let isAddin = location.href.indexOf('mode=web') === -1;
            if (isAddin) {
                Office.initialize = reason => resolve(true);
            }
            else {
                return resolve(isAddin);
            }
        });
    }
}

AppModule.start();
