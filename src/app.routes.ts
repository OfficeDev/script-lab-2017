import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorView } from './app/editor';
import { GalleryView } from './app/gallery';
import { HamburgerComponent, Dialog, Tab, MonacoEditor } from './app/shared/components';

export const COMPONENT_DECLARATIONS = [
    // NewComponent,
    EditorView,
    GalleryView,
    // ShareComponent,
    // ImportComponent,
    // ViewComponent,
    Tab,
    MonacoEditor,
    HamburgerComponent,
    Dialog
];

export const AppRoutes: Routes = [
    {
        path: '',
        component: EditorView
    },
    {
        path: ':id',
        component: EditorView
    }
    // {
    //     path: 'new',
    //     component: NewComponent
    // },
    // {
    //     path: 'share/:id',
    //     component: ShareComponent
    // },
    // {
    //     path: 'import',
    //     component: ImportComponent
    // },
    // {
    //     path: 'view/:provider/:id',
    //     component: ViewComponent
    // }
];

export const APP_ROUTES = RouterModule.forRoot(AppRoutes, { useHash: true });
