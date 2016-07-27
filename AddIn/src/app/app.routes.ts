import {provideRouter, RouterConfig} from '@angular/router';
import {EditorComponent, SnippetCreateComponent} from '../components'

export const AppRoutes: RouterConfig = [
    {
        path: '',
        component: EditorComponent
    },
    {
        path: ':id',
        component: EditorComponent
    },
    {
        path: 'new',
        component: SnippetCreateComponent
    }
];

export const routes: RouterConfig = [
    ...AppRoutes,
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];