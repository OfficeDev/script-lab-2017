import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, CommandIcon } from './app/components';
import { MonacoEditor, EditorView, GalleryView, GalleryList } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    EditorView,
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
        component: EditorView
    },
    {
        path: ':source/:id',
        component: EditorView
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
