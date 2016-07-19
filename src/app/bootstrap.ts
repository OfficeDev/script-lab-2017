import 'rxjs/Rx';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {provide, ExceptionHandler, Component} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';
import {ROUTER_DIRECTIVES, Router} from '@angular/router';
import {MediatorService} from "./shared/services";
import {Utils, ExceptionHelper, RequestHelper} from "./shared/helpers";

function launch(reason?: Office.InitializationReason, inject?: boolean) {
    bootstrap(AppComponent, [
        HTTP_PROVIDERS,
        provide(ExceptionHandler, { useClass: ExceptionHelper }), 
        RequestHelper,
        MediatorService
    ]);
}

@Component({
    selector: 'app',
    template:
    `<div class="app-container">  
        <h1>Hello World</h1>      
        <main class="app-container__main ms-font-m ms-fontColor-neutralPrimary">            
        </main>
        <footer class="app-container__footer"></footer>
     </div>`,
    directives: []
})


export class AppComponent { }

Utils.isWord ? Office.initialize = launch : launch(null, true);