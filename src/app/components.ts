import { NewComponent } from './new';
import { EditorComponent } from './editor';
import { RunComponent } from './run';
import { ShareComponent } from './share';
import { ImportComponent } from './import';
import { ViewComponent } from './view';
import { Tab, Tabs } from './shared/components';

export * from './new';
export * from './editor';
export * from './run';
export * from './share';
export * from './import';
export * from './view';

export const COMPONENT_DECLARATIONS = [
  NewComponent,
  EditorComponent,
  RunComponent,
  ShareComponent,
  ImportComponent,
  ViewComponent,
  Tab,
  Tabs
];
