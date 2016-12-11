import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, Command, Alert, Dialog, SnippetInfo } from './app/components';
import { MonacoEditor, GalleryView, GalleryList } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    GalleryView,
    GalleryList,
    MonacoEditor,
    Hamburger,
    Collapse,
    Alert,
    Dialog,
    SnippetInfo,
    Command
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
