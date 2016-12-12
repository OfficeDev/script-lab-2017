import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, Command, Alert, Dialog, SnippetInfo } from './app/components';
import { Editor, GalleryView, GalleryList } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    GalleryView,
    GalleryList,
    Editor,
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
        component: Editor
    },
    {
        path: ':source/:id',
        component: Editor
    }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
