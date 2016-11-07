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


export function launch() {
    if (!Authenticator.isAuthDialog()) {
        if (!window.location.href.indexOf('localhost')) {
            enableProdMode();
        }

        Theme.applyTheme().then(result => {
            $('.app .ms-ProgressIndicator-itemDescription').text('Loading the runtime...');

            platformBrowserDynamic()
                .bootstrapModule(AppModule)
                .catch(UxUtil.catchError('Error', 'An error occurred while loading the playground'));

            Office.initialize = reason => {
                // Note: due to existing bug, this is not safe to call as is right now, need to check for requirements.
                // However, given some of the other pending issues with the dialogs (no support on Online,
                // inability to execute OM code from within the dialog) just disabling the dialog functionality for now.
                // if (Office.context.requirements.isSetSupported('DialogAPI', 1.1)) {
                // TODO (Bhargav): make this work.  For now just always showing by default regardless of host.
                // $('.display-if-office-js-dialog-enabled').show();
                // }
            };
        });
    }
}

launch();
