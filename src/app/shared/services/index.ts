import { Github } from './github';
import { Request } from './request';
import { Mediator } from './mediator';
import { SnippetManager } from './snippet.manager';

export * from './github';
export * from './mediator';
export * from './snippet';
export * from './snippet.manager';

export const SERVICE_PROVIDERS = [
  Request,
  Mediator,
  SnippetManager
];
