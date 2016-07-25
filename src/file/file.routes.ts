import {provideRouter, RouterConfig} from '@angular/router';
import {FileListComponent, FileTreeComponent, FileDetailComponent, FileCreateComponent} from "../file";

export const FileRoutes: RouterConfig = [
    {
        path: ':org/:repo/:branch',
        component: FileListComponent,
        children: [
            {
                path: '',
                component: FileTreeComponent
            },
            {
                path: ':path',
                component: FileTreeComponent
            },
            {
                path: ':path/detail',
                component: FileDetailComponent
            }                        
        ]
    },
    {
        path: ':org/:repo/:branch/create/:path',
        component: FileCreateComponent
    }
];