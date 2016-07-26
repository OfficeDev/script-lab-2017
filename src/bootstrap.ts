import {bootstrap} from '@angular/platform-browser-dynamic';
import {AppComponent, PROVIDER_OVERRIDES, APP_PROVIDERS, APP_ROUTER_PROVIDERS} from "./app";
import {Utilities} from "./shared/helpers";

export function launch(initialHmrState?: any) {
    bootstrap(AppComponent, [
        ...PROVIDER_OVERRIDES,
        ...APP_PROVIDERS
    ])
        .catch(err => Utilities.error);
}

launch();