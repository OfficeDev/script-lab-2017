import { GitHubService } from './github.service';
import { Request } from './request';
import { MonacoService } from './monaco.service';

export * from './github.service';
export * from './request';
export * from './monaco.service';

export const SERVICE_PROVIDERS = [
    Request,
    MonacoService,
    GitHubService
];
