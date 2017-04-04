import * as $ from 'jquery';

import { NgModule, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator } from '@microsoft/office-js-helpers';

import { SERVICE_PROVIDERS, MonacoService } from './app/services';
import { PIPES } from './app/pipes';
import { EXCEPTION_PROVIDER, applyTheme, AI, settings, environment } from './app/helpers';
import { COMPONENT_DECLARATIONS } from './components';
import { AppComponent } from './app/containers';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { rootReducer, createDefaultState } from './app/reducers';
import { SnippetEffects, MonacoEffects, UIEffects, GitHubEffects } from './app/effects';

import './assets/styles/editor.scss';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        StoreModule.provideStore(rootReducer, createDefaultState(settings.current)),
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
            await Promise.all([
                environment.initialize(),
                MonacoService.initialize()
            ]);

            const timer = AI.trackPageView('Mode', `/${environment.current.host}`);
            AI.initialize(environment.current.config.instrumentationKey);

            if (!environment.current.devMode) {
                enableProdMode();
            }

            await applyTheme(environment.current.host);

            if (!Authenticator.isAuthDialog()) {
                AI.trackEvent(`[Perf] Playground ready`, { host: environment.current.host });
                await platformBrowserDynamic().bootstrapModule(AppModule);
                timer.stop();
            }
        }
        catch (e) {
            $('.ms-progress-component__sub-title').text('Error initializing the Playground.');
            $('.ms-progress-component__footer').hide();
            AI.trackException(e, 'Playground Initialization');
        }
    }
}

AppModule.start();
