import {provideRouter, RouterConfig} from '@angular/router';
import {EditorComponent} from '../components'

export const AppRoutes: RouterConfig = [
    {
        path: '',
        component: EditorComponent
    }
];

export const routes: RouterConfig = [
    ...AppRoutes,
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];