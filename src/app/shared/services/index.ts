import { Github } from './github';
import { Request } from './request';
import { Mediator } from './mediator';
import { SnippetManager } from './snippet.manager';
import { Monaco } from './monaco';
import { Intellisense } from './intellisense';

export * from './github';
export * from './mediator';
export * from './snippet';
export * from './snippet.manager';
export * from './request';
export * from './monaco';
export * from './intellisense';

export const SERVICE_PROVIDERS = [
  Request,
  Mediator,
  SnippetManager,
  Intellisense,
  Monaco
];
