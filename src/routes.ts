import {provideRouter, RouterConfig} from '@angular/router';
import {FileRoutes} from "./file";
import {RepoComponent} from './repo/repo.component';

export const BaseRoutes: RouterConfig = [
    {
        path: '',
        component: RepoComponent
    },
    {
        path: ':org',
        component: RepoComponent
    }
];

export const routes: RouterConfig = [
    ...BaseRoutes,
    ...FileRoutes
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];