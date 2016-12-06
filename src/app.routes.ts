import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, Dialog, CommandIcon } from './app/components';
import { MonacoEditor, EditorView, GalleryView } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    EditorView,
    GalleryView,
    MonacoEditor,
    Hamburger,
    Collapse,
    Dialog,
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
