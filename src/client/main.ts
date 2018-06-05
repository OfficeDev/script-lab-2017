import * as $ from 'jquery';

import { NgModule, enableProdMode } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Authenticator, UI, Utilities, PlatformType } from '@microsoft/office-js-helpers';
import { StoreModule, Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { SERVICE_PROVIDERS, MonacoService } from './app/services';
import { PIPES } from './app/pipes';
import {
  EXCEPTION_PROVIDER,
  applyTheme,
  AI,
  storage,
  environment,
  isInsideOfficeApp,
  PlaygroundError,
} from './app/helpers';
import { Strings } from './app/strings';
import { COMPONENT_DECLARATIONS } from './components';
import { AppComponent, EditorMode, ViewMode, ViewModeError } from './app/containers';
import { rootReducer, getSettings, State } from './app/reducers';
import { SnippetEffects, MonacoEffects, UIEffects, GitHubEffects } from './app/effects';
import './assets/styles/editor.scss';

let appRoutes: Routes = [
  { path: 'view/:host/:type/:id', component: ViewMode },
  { path: 'view/error', component: ViewModeError },
  { path: 'edit/:host/:type/:id', component: EditorMode },
  { path: 'edit/:host', component: EditorMode },
  { path: '', component: EditorMode },
];

let imports = [
  BrowserModule,
  HttpModule,
  FormsModule,
  RouterModule.forRoot(appRoutes, { useHash: true }),
  StoreModule.provideStore(rootReducer),
  EffectsModule.run(SnippetEffects),
  EffectsModule.run(MonacoEffects),
  EffectsModule.run(GitHubEffects),
  EffectsModule.run(UIEffects),
];

(async function start() {
  const strings = Strings();

  try {
    await Promise.all([environment.initialize(), MonacoService.initialize()]);

    const timer = AI.trackPageView('Mode', `/${environment.current.host}`);
    AI.initialize(environment.current.config.instrumentationKey);

    if (!environment.current.devMode) {
      enableProdMode();
    } else {
      imports.push(StoreDevtoolsModule.instrumentOnlyWithExtension());
    }

    await applyTheme(environment.current.host);

    if (isInsideOfficeApp() && Utilities.platform === PlatformType.PC) {
      if (isO16orHigher()) {
        // For Office 2016 MSI, need to have a build that supports the "GetHostInfo" API.
        // Otherwise, the code will never run, because switching to the runner domain will lose the host info.
        try {
          (window.external as any).GetHostInfo();
        } catch (e) {
          throw new PlaygroundError(
            `Your Office version is missing important updates, that Script Lab can't run without. Please install the latest Office updates from https://docs.microsoft.com/en-us/officeupdates/office-updates-msi`
          );
        }
      }
    }

    if (!Authenticator.isAuthDialog(environment.current.host === 'TEAMS')) {
      AI.trackEvent(`[Perf] Playground ready`);
      await platformBrowserDynamic().bootstrapModule(AppModule);
      timer.stop();
    }
  } catch (e) {
    $('.ms-progress-component__sub-title')
      .text(
        e instanceof PlaygroundError
          ? e.message
          : strings.HtmlPageStrings.errorInitializingScriptLab
      )
      .css('cursor', 'pointer')
      .click(() => UI.notify(e));
    $('.ms-progress-component__footer').hide();
    AI.trackException(e, 'Playground Initialization');
  }

  // Helpers
  function isO16orHigher(): boolean {
    const hasVersion =
      Office &&
      Office.context &&
      Office.context.diagnostics &&
      Office.context.diagnostics.version;
    if (hasVersion) {
      const versionString = Office.context.diagnostics.version;
      let num = Number.parseInt(versionString.substr(0, versionString.indexOf('.')));
      return num >= 16;
    }

    // The only hosts that don't support Office.context.diagnostics.version are the 2016 hosts that
    //     still use the non-updated "16.00" files (by contrast, 15.XX files do support it)
    // So it's actually a giveaway that they *are* O16.
    return true;
  }
})();

@NgModule({
  imports,
  declarations: [AppComponent, ...COMPONENT_DECLARATIONS, ...PIPES],
  bootstrap: [AppComponent],
  providers: [...SERVICE_PROVIDERS, EXCEPTION_PROVIDER],
})
export class AppModule {
  constructor(private _store: Store<State>) {
    this._store.dispatch({
      type: 'SET_ROOT_STATE',
      payload: storage.current,
    });

    this._store
      .select(getSettings)
      .debounceTime(300)
      .subscribe(changes => {
        storage.appendCurrent(changes);
      });
  }
}
