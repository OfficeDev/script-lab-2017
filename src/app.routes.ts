import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent, NewComponent, EditorComponent, RunComponent, ShareComponent, ImportComponent, ViewComponent } from './app/components';

export const AppRoutes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'new',
        component: NewComponent
    },
    {
        path: 'edit/:id',
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
        path: 'import',
        component: ImportComponent
    },
    {
        path: 'view/:provider/:id',
        component: ViewComponent
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });