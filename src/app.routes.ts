import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorView } from './app/editor';
// import { GalleryView } from './app/gallery';
import { ImportView } from './app/import';
import { Collapse, Hamburger, Dialog, MonacoEditor, CommandIcon } from './app/components';

export const COMPONENT_DECLARATIONS = [
    EditorView,
    ImportView,
    // GalleryView,
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
