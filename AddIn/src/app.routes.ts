import {provideRouter, RouterConfig} from '@angular/router';
import {RunComponent, EditorComponent, NewComponent, ShareComponent, ViewComponent, ExcelLauncherComponent, WebLauncherComponent} from './components';

export const AppRoutes: RouterConfig = [
    {
        path: '',
        redirectTo: 'new',
        pathMatch: 'full'
    },
    {
        path: 'excel',
        component: ExcelLauncherComponent,
    },
    {
        path: 'web',
        component: WebLauncherComponent,
    },
    {
        path: 'new',
        component: NewComponent,
    },
    {
        path: 'edit/:id/:new',
        component: EditorComponent
    },
    {
        path: 'run/:id/:returnToEdit',
        component: RunComponent
    },
    {
        path: 'share/:id',
        component: ShareComponent
    },
    {
        path: 'view/:id',
        component: ViewComponent
    }
];

export const routes: RouterConfig = [
    ...AppRoutes,
];

export const APP_ROUTER_PROVIDERS = [
    provideRouter(routes)
];