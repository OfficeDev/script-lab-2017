import * as $ from 'jquery';

import { NgModule, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, UI } from '@microsoft/office-js-helpers';
import { StoreModule, Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { SERVICE_PROVIDERS, MonacoService } from './app/services';
import { PIPES } from './app/pipes';
import { EXCEPTION_PROVIDER, applyTheme, AI, storage, environment } from './app/helpers';
import { Strings } from './app/strings';
import { COMPONENT_DECLARATIONS } from './components';
import { AppComponent, EditorMode, ViewMode, ViewModeError } from './app/containers';
import { rootReducer, getSettings, State } from './app/reducers';
import { SnippetEffects, MonacoEffects, UIEffects, GitHubEffects } from './app/effects';
import './assets/styles/editor.scss';

let appRoutes: Routes = [
    { path: 'view/:type/:host/:id', component: ViewMode  },
    { path: 'view/error', component: ViewModeError  },
    { path: 'edit/:type/:host/:id', component: EditorMode },
    { path: 'edit/:host', component: EditorMode },
    { path: '',  component: EditorMode }
];

let imports = [
    BrowserModule,
    HttpModule,
    FormsModule,
    RouterModule.forRoot(
      appRoutes,
      { useHash: true }
    ),
    StoreModule.provideStore(rootReducer),
    EffectsModule.run(SnippetEffects),
    EffectsModule.run(MonacoEffects),
    EffectsModule.run(GitHubEffects),
    EffectsModule.run(UIEffects)
];

(async function start() {
    const strings = Strings();
    const WAC_URL_STORAGE_KEY = 'playground_wac_url';

    try {
        await Promise.all([
            environment.initialize(),
            MonacoService.initialize()
        ]);

        let pageParams = Authenticator.extractParams(window.location.href.split('?')[1]) || {};
        // wacUrl query string parameter must be encoded
        if (pageParams.wacUrl) {
            window.localStorage.setItem(WAC_URL_STORAGE_KEY, pageParams.wacUrl);
        }

        const timer = AI.trackPageView('Mode', `/${environment.current.host}`);
        AI.initialize(environment.current.config.instrumentationKey);

        if (!environment.current.devMode) {
            enableProdMode();
        }
        else {
            imports.push(StoreDevtoolsModule.instrumentOnlyWithExtension());
        }

        await applyTheme(environment.current.host);

        if (!Authenticator.isAuthDialog(environment.current.host === 'TEAMS')) {
            AI.trackEvent(`[Perf] Playground ready`);
            await platformBrowserDynamic().bootstrapModule(AppModule);
            timer.stop();
        }
    }
    catch (e) {
        $('.ms-progress-component__sub-title')
            .text(strings.HtmlPageStrings.errorInitializingScriptLab)
            .css('cursor', 'pointer')
            .click(() => UI.notify(e));
        $('.ms-progress-component__footer').hide();
        AI.trackException(e, 'Playground Initialization');
    }
})();

@NgModule({
    imports,
    declarations: [AppComponent, ...COMPONENT_DECLARATIONS, ...PIPES],
    bootstrap: [AppComponent],
    providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER]
})
export class AppModule {
    constructor(private _store: Store<State>) {
        this._store.dispatch({
            type: 'SET_ROOT_STATE',
            payload: storage.current
        });

        this._store
            .select(getSettings)
            .debounceTime(300)
            .subscribe(changes => { storage.current = changes; });
    }
}
