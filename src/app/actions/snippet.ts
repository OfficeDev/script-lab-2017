import { Utilities } from '@microsoft/office-js-helpers';
import { Action } from '@ngrx/store';
import { type } from '../helpers';

/**
 * For each action type in an action group, make a simple
 * enum object for all of this group's action types.
 *
 * The 'type' utility function coerces strings into string
 * literal types and runs a simple check to guarantee all
 * action types in the application are unique.
 */
export const SnippetActionTypes = {
    VIEW: type('[Snippet] View'),
    IMPORT: type('[Snippet] Import'),
    IMPORT_SUCCESS: type('[Snippet] Import Successful'),
    RUN: type('[Snippet] Run'),
    CREATE: type('[Snippet] Create'),
    SAVE: type('[Snippet] Save'),
    SHARE: type('[Snippet] Share'),
    DELETE: type('[Snippet] Delete'),
    DELETE_ALL: type('[Snippet] Delete All'),
    STORE_UPDATED: type('[Snippet] Storage Updated'),
    LOAD_SNIPPETS: type('[Snippet] Load Snippets'),
    LOAD_SNIPPETS_SUCCESS: type('[Snippet] Load Snippets Success'),
    LOAD_TEMPLATES: type('[Snippet] Load Templates'),
    LOAD_TEMPLATES_SUCCESS: type('[Snippet] Load Templates Success')
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ViewAction implements Action {
    type = SnippetActionTypes.VIEW;

    constructor(public payload: ISnippet) { }
}

export class ImportAction implements Action {
    type = SnippetActionTypes.IMPORT;

    constructor(public payload: string, public params: string = '') { }
}

export class ImportSuccess implements Action {
    type = SnippetActionTypes.IMPORT_SUCCESS;

    constructor(public payload: ISnippet, public params: boolean) { }
}

export class RunAction implements Action {
    type = SnippetActionTypes.RUN;

    constructor(public payload: ISnippet) { }
}

export class CreateAction implements Action {
    type = SnippetActionTypes.CREATE;

    constructor(public payload: ISnippet) { }
}

export class SaveAction implements Action {
    type = SnippetActionTypes.SAVE;

    constructor(public payload: ISnippet) { }
}

export class ShareAction implements Action {
    type = SnippetActionTypes.SHARE;

    constructor(public payload: ISnippet) { }
}

export class DeleteAction implements Action {
    type = SnippetActionTypes.DELETE;

    constructor(public payload: string) { }
}

export class DeleteAllAction implements Action {
    type = SnippetActionTypes.DELETE_ALL;

    constructor() { }
}

export class StoreUpdated implements Action {
    type = SnippetActionTypes.STORE_UPDATED;

    constructor() { }
}

export class LoadSnippets implements Action {
    type = SnippetActionTypes.LOAD_SNIPPETS;

    constructor() { }
}

export class LoadTemplates implements Action {
    type = SnippetActionTypes.LOAD_TEMPLATES;

    constructor(public payload: string = 'LOCAL') { }
}

export class LoadSnippetsSuccess implements Action {
    type = SnippetActionTypes.LOAD_SNIPPETS_SUCCESS;

    constructor(public payload: ISnippet[]) { }
}

export class LoadTemplatesSuccess implements Action {
    type = SnippetActionTypes.LOAD_TEMPLATES_SUCCESS;

    constructor(public payload: ITemplate[]) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type SnippetActions
    = ViewAction
    | ImportAction
    | ImportSuccess
    | RunAction
    | SaveAction
    | ShareAction
    | DeleteAction
    | DeleteAllAction
    | StoreUpdated
    | LoadSnippets
    | LoadTemplates;
