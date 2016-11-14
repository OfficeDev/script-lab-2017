import { Github } from './github';
import { Request } from './request';
import { Mediator } from './mediator';
import { SnippetManager } from './snippet.manager';
import { Monaco } from './monaco';
import { Intellisense } from './intellisense';
import { Notification } from './notification';

export * from './github';
export * from './mediator';
export * from './snippet';
export * from './snippet.manager';
export * from './request';
export * from './monaco';
export * from './intellisense';
export * from './notification';

export const SERVICE_PROVIDERS = [
  Request,
  Mediator,
  SnippetManager,
  Intellisense,
  Notification,
  Monaco
];
