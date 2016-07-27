import {provideRouter, RouterConfig} from '@angular/router';
import {RunComponent, EditorComponent, NewComponent} from '../components'

export const AppRoutes: RouterConfig = [
    {
        path: '',
        component: NewComponent
    },
    {
        path: 'edit',
        component: EditorComponent
    },
    {
        path: 'edit/:name',
        component: EditorComponent
    },
    {
        path: 'edit/:name/run',
        component: RunComponent
    }
];

export const routes: RouterConfig = [
    ...AppRoutes,
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];