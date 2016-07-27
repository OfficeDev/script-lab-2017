import {provideRouter, RouterConfig} from '@angular/router';
import {RunComponent, EditorComponent, NewComponent} from '../components'

export const AppRoutes: RouterConfig = [
    {
        path: ':id',
        component: EditorComponent
    },
    {
        path: '',
        component: NewComponent
    },
    {
        path: ':id/run',
        component: RunComponent
    }
];

export const routes: RouterConfig = [
    ...AppRoutes,
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];