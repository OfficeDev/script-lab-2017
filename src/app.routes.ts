import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorView } from './app/editor';
import { GalleryView } from './app/gallery';
import { Collapse, Hamburger, Dialog, Tab, MonacoEditor, Panel } from './app/shared/components';

export const COMPONENT_DECLARATIONS = [
    EditorView,
    GalleryView,
    Tab,
    MonacoEditor,
    Hamburger,
    Collapse,
    Dialog,
    Panel
];

export const AppRoutes: Routes = [
    {
        path: '',
        component: EditorView
    },
    {
        path: 'gist/:id',
        component: EditorView
    },
    {
        path: 'local/:id',
        component: EditorView
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
