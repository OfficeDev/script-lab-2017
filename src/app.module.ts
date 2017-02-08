import * as $ from 'jquery';

import { NgModule, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';

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
    static _cache = new Storage<string>(`playground_cache`, StorageType.SessionStorage);

    static async start() {
        try {
            if (Environment.env === 'PRODUCTION') {
                enableProdMode();
            }

            await Promise.all([
                MonacoService.initialize().then(() => console.log('Monaco service initialized')),
                AppModule.initialize().then(() => console.log('AppModule initialized'))
            ]);

            await Theme.applyTheme(Environment.host);

            if (!Authenticator.isAuthDialog()) {
                AI.trackEvent(`Playground ready`, { host: Environment.host });
                platformBrowserDynamic().bootstrapModule(AppModule);
            }
        }
        catch (e) {
            $('.ms-progress-component__sub-title').text('Error initializing the Playground, see the console for more details');
            $('.ms-progress-component__footer').hide();
            console.log(e);
            AI.trackException(e, 'Playground Initialization');
        }
    }

    static initialize() {
        return new Promise<boolean>(resolve => {
            let hostButtonsTimeout = setTimeout(() => {
                $('#hosts').show();
                $('.ms-progress-component__footer').hide();
                $('.hostButton').click(function () {
                    Environment.host = $(this).data('host');
                    Environment.platform = null;
                    AppModule._cache.insert('isInRegularWebBrowser', Environment.host);
                    AppModule._cache.insert('host', Environment.host);
                    console.log(`Host-button click, selecting ${Environment.host}`);
                    resolve(Environment.host);
                });
            }, 3000);

            if (window.location.href.toLowerCase().indexOf('?mode=web') > 0) {
                clearTimeout(hostButtonsTimeout);
                console.log(`URL contains "?mode=web", initializing App module to that`);
                Environment.host = 'web';
                AppModule._cache.insert('host', Environment.host);
                AppModule._cache.insert('isInRegularWebBrowser', Environment.host);
                resolve(Environment.host);
                return;
            }

            if (AppModule._cache.contains('isInRegularWebBrowser') && AppModule._cache.contains('host')) {
                clearTimeout(hostButtonsTimeout);
                Environment.host = AppModule._cache.get('host');
                console.log(`Is in regular web-browser mode, and host has already been selected to ${Environment.host} earlier`);
                resolve(Environment.host);
                return;
            }

            Office.initialize = () => {
                clearTimeout(hostButtonsTimeout);
                Environment.host = Utilities.host.toLowerCase();
                Environment.platform = Utilities.platform;
                console.log(`Office.initialize called, host is ${Environment.host}, platform ${Environment.platform}`);
                AppModule._cache.insert('host', Environment.host);
                resolve(Environment.host);
                return;
            };
        });
    }

    static get initialState() {
        let settings = AppComponent.settings.get(Utilities.host.toLowerCase()) as ISettings;
        return createDefaultState(settings);
    }
}

AppModule.start();
