import { NgModule, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, Utilities } from '@microsoft/office-js-helpers';

import { SERVICE_PROVIDERS, MonacoService } from './app/services';
import { PIPES } from './app/pipes';
import { EXCEPTION_PROVIDER, Theme, AI } from './app/helpers';
import { COMPONENT_DECLARATIONS } from './components';
import { AppComponent } from './app/containers';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { rootReducer, createDefaultState } from './app/reducers';
import { SnippetEffects, MonacoEffects, UIEffects, GitHubEffects } from './app/effects';
import { Environment } from './environment';

import './assets/styles/spinner.scss';
import './assets/styles/globals.scss';


@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        StoreModule.provideStore(rootReducer, AppModule.initialState),
        StoreDevtoolsModule.instrumentOnlyWithExtension(),
        EffectsModule.run(SnippetEffects),
        EffectsModule.run(MonacoEffects),
        EffectsModule.run(GitHubEffects),
        EffectsModule.run(UIEffects)
    ],
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS, ...PIPES],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    static async start() {
        try {
            if (Environment.env === 'PRODUCTION') {
                enableProdMode();
            }

            await Promise.all([
                MonacoService.initialize(),
                AppModule.initialize()
            ]);

            await Theme.applyTheme();

            if (!Authenticator.isAuthDialog()) {
                AI.trackEvent(`Playground ready`, { host: Utilities.host.toLowerCase() });
                platformBrowserDynamic().bootstrapModule(AppModule);
            }
        }
        catch (e) {
            AI.trackException(e, 'Playground Initialization');
        }
    }

    static initialize() {
        return new Promise<boolean>(resolve => {
            let isAddin = location.href.indexOf('mode=web') === -1;
            if (isAddin) {
                Office.initialize = () => resolve(true);
            }
            else {
                return resolve(isAddin);
            }
        });
    }

    static get initialState() {
        let settings = AppComponent.settings.get(Utilities.host.toLowerCase()) as ISettings;
        return createDefaultState(settings);
    }
}

AppModule.start();
