import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as Views from './app/components';

export const AppRoutes: Routes = [
    {
        path: '',
        component: Views.EditorComponent
    },
    {
        path: ':id',
        component: Views.EditorComponent
    },
    {
        path: 'new',
        component: Views.NewComponent
    },
    {
        path: 'run/:id/:returnToEdit',
        component: Views.RunComponent
    },
    {
        path: 'share/:id',
        component: Views.ShareComponent
    },
    {
        path: 'import',
        component: Views.ImportComponent
    },
    {
        path: 'view/:provider/:id',
        component: Views.ViewComponent
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });