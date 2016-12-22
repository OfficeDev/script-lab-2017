import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Collapse, Hamburger, Command, Alert, About, Dialog, SnippetInfo, Profile } from './app/components';
import { Editor, Gallery, GalleryList, Import } from './app/containers';

export const COMPONENT_DECLARATIONS = [
    Gallery,
    GalleryList,
    Editor,
    Import,
    Hamburger,
    Collapse,
    Alert,
    Profile,
    Dialog,
    SnippetInfo,
    About,
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
