import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, CommandIcon } from './app/components';
import { MonacoEditor, GalleryView, GalleryList } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    GalleryView,
    GalleryList,
    MonacoEditor,
    Hamburger,
    Collapse,
    CommandIcon
];

export const AppRoutes: Routes = [
    {
        path: '',
        component: MonacoEditor
    },
    {
        path: ':source/:id',
        component: MonacoEditor
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
