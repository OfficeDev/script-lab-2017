import { Github } from './github';
import { Request } from './request';
import { SnippetManager } from './snippet.manager';
import { Monaco } from './monaco';
import { Intellisense } from './intellisense';
import { Notification } from './notification';

export * from './github';
export * from './snippet';
export * from './snippet.manager';
export * from './request';
export * from './monaco';
export * from './intellisense';
export * from './notification';

export const SERVICE_PROVIDERS = [
  Request,
  SnippetManager,
  Intellisense,
  Notification,
  Monaco
];
