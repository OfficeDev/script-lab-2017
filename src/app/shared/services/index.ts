import { MediatorService } from './mediator.service';
import { SnippetManager } from './snippet.manager';

export * from './github.service';
export * from './mediator.service';
export * from './snippet';
export * from './snippet.manager';

export const SERVICE_PROVIDERS = [
  MediatorService,
  SnippetManager
];