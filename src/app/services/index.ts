import { Github } from './github';
import { Request } from './request';
import { MonacoService } from './monaco.service';

export * from './github';
export * from './request';
export * from './monaco.service';
export * from './disposable';

export const SERVICE_PROVIDERS = [
    Request,
    MonacoService,
    Github
];
