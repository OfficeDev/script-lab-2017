import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorView } from './app/editor';
import { GalleryView } from './app/gallery';
import { ImportView } from './app/import';
import { Collapse, Hamburger, Dialog, Tab, MonacoEditor } from './app/shared/components';

export const COMPONENT_DECLARATIONS = [
    EditorView,
    ImportView,
    GalleryView,
    Tab,
    MonacoEditor,
    Hamburger,
    Collapse,
    Dialog
];

export const AppRoutes: Routes = [
    {
        path: '',
        component: EditorView
    },
    {
        path: ':store/:id',
        component: EditorView
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
