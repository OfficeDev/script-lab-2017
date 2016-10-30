import { Github } from './github';
import { Mediator } from './mediator';
import { SnippetManager } from './snippet.manager';

export * from './github';
export * from './mediator';
export * from './snippet';
export * from './snippet.manager';

export const SERVICE_PROVIDERS = [
  Mediator,
  SnippetManager
];