import * as $ from 'jquery';

import { NgModule, enableProdMode, ApplicationRef } from '@angular/core';
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

import { removeNgStyles, createNewHosts, createInputTransfer, bootloader } from '@angularclass/hmr';
import { StoreModule, Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreLogMonitorModule, useLogMonitor } from '@ngrx/store-log-monitor';
import { EffectsModule } from '@ngrx/effects';
import { rootReducer, createDefaultState } from './app/reducers';
import { SnippetEffects, MonacoEffects, UIEffects, GitHubEffects } from './app/effects';

import 'rxjs/add/operator/take';
import './assets/styles/editor.scss';

let imports = [
    BrowserModule,
    HttpModule,
    FormsModule,
    StoreModule.provideStore(rootReducer, createDefaultState(settings.current)),
    EffectsModule.run(SnippetEffects),
    EffectsModule.run(MonacoEffects),
    EffectsModule.run(GitHubEffects),
    EffectsModule.run(UIEffects)
];

if ((module as any).hot) {
    imports.push(...[
        StoreDevtoolsModule.instrumentStore({
            monitor: useLogMonitor({
                visible: true,
                position: 'right'
            })
        }),
        StoreLogMonitorModule
    ]);
}

@NgModule({
    imports,
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS, ...PIPES],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    constructor(public appRef: ApplicationRef, private _store: Store<any>) {

    }

    hmrOnInit(store) {
        if (!store || !store.rootState) {
            return;
        }

        // restore state by dispatch a SET_ROOT_STATE action
        if (store.rootState) {
            console.log('Applying HMR...', store.rootState);
            this._store.dispatch({
                type: 'SET_ROOT_STATE',
                payload: store.rootState
            });
        }

        if ('restoreInputValues' in store) {
            store.restoreInputValues();
        }

        this.appRef.tick();
        Object.keys(store).forEach(prop => delete store[prop]);
    }

    hmrOnDestroy(store) {
        const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
        this._store.take(1).subscribe(s => store.rootState = s);
        store.disposeOldHosts = createNewHosts(cmpLocation);
        store.restoreInputValues = createInputTransfer();
        removeNgStyles();
    }

    hmrAfterDestroy(store) {
        store.disposeOldHosts();
        delete store.disposeOldHosts;
    }

    static async start() {
        try {
            if (!environment.current.devMode) {
                enableProdMode();
            }

            AI.initialize(environment.current.config.instrumentationKey);

            await Promise.all([
                environment.initialize(),
                MonacoService.initialize()
            ]);

            await applyTheme(environment.current.host);

            if (!Authenticator.isAuthDialog()) {
                AI.trackEvent(`Playground ready`, { host: environment.current.host });
                platformBrowserDynamic().bootstrapModule(AppModule);
            }
        }
        catch (e) {
            $('.ms-progress-component__sub-title').text('Error initializing the Playground.');
            $('.ms-progress-component__footer').hide();
            AI.trackException(e, 'Playground Initialization');
        }
    }
}

bootloader(AppModule.start());
