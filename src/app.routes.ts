import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// import { NewComponent } from './app/new';
import { EditorComponent } from './app/editor';
// import { ShareComponent } from './app/share';
// import { ImportComponent } from './app/import';
// import { ViewComponent } from './app/view';
import { MonacoEditorTab, MonacoEditorTabs } from './app/shared/components';

export const COMPONENT_DECLARATIONS = [
    // NewComponent,
    EditorComponent,
    // ShareComponent,
    // ImportComponent,
    // ViewComponent,
    MonacoEditorTab,
    MonacoEditorTabs
];

export const AppRoutes: Routes = [
    {
        path: '',
        component: EditorComponent
    },
    {
        path: ':id',
        component: EditorComponent
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
