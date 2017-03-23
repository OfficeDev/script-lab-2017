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
export class SnippetActionTypes {
    static readonly VIEW = type('[Snippet] View');
    static readonly IMPORT = type('[Snippet] Import');
    static readonly IMPORT_SUCCESS = type('[Snippet] Import Successful');
    static readonly RUN = type('[Snippet] Run');
    static readonly CREATE = type('[Snippet] Create');
    static readonly UPDATE_INFO = type('[Snippet] Update Info');
    static readonly DUPLICATE = type('[Snippet] Duplicate');
    static readonly SAVE = type('[Snippet] Save');
    static readonly SHARE = type('[Snippet] Share');
    static readonly DELETE = type('[Snippet] Delete');
    static readonly DELETE_ALL = type('[Snippet] Delete All');
    static readonly STORE_UPDATED = type('[Snippet] Storage Updated');
    static readonly LOAD_SNIPPETS = type('[Snippet] Load Snippets');
    static readonly LOAD_SNIPPETS_SUCCESS = type('[Snippet] Load Snippets Success');
    static readonly LOAD_TEMPLATES = type('[Snippet] Load Templates');
    static readonly LOAD_TEMPLATES_SUCCESS = type('[Snippet] Load Templates Success');
};

export class ImportType {
    static readonly DEFAULT = type('[Import] Load blank snippet');
    static readonly OPEN = type('[Import] Open an existing snippet');
    static readonly GIST = type('[Import] Import from a gist');
    static readonly YAML = type('[Import] Import from yaml');
    static readonly URL = type('[Import] Import from url');
    static readonly SAMPLE = type('[Import] Import from sample');
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ViewAction implements Action {
    readonly type = SnippetActionTypes.VIEW;

    constructor(public payload: ISnippet) { }
}

export class ImportAction implements Action {
    readonly type = SnippetActionTypes.IMPORT;

    constructor(public mode: string, public payload?: string) { }
}

export class ImportSuccessAction implements Action {
    readonly type = SnippetActionTypes.IMPORT_SUCCESS;

    constructor(public payload: ISnippet) { }
}

export class UpdateInfoAction implements Action {
    readonly type = SnippetActionTypes.UPDATE_INFO;

    constructor(public payload: { name: string, description: string }) { }
}

export class RunAction implements Action {
    readonly type = SnippetActionTypes.RUN;

    constructor(public payload: ISnippet) { }
}

export class CreateAction implements Action {
    readonly type = SnippetActionTypes.CREATE;

    constructor(public payload: ISnippet) { }
}

export class DuplicateAction implements Action {
    readonly type = SnippetActionTypes.DUPLICATE;

    constructor(public payload: string) { }
}

export class SaveAction implements Action {
    readonly type = SnippetActionTypes.SAVE;

    constructor(public payload: ISnippet) { }
}

export class ShareAction implements Action {
    readonly type = SnippetActionTypes.SHARE;

    constructor(public payload: ISnippet) { }
}

export class DeleteAction implements Action {
    readonly type = SnippetActionTypes.DELETE;

    constructor(public payload: string) { }
}

export class DeleteAllAction implements Action {
    readonly type = SnippetActionTypes.DELETE_ALL;

    constructor() { }
}

export class StoreUpdatedAction implements Action {
    readonly type = SnippetActionTypes.STORE_UPDATED;

    constructor() { }
}

export class LoadSnippetsAction implements Action {
    readonly type = SnippetActionTypes.LOAD_SNIPPETS;

    constructor() { }
}

export class LoadTemplatesAction implements Action {
    readonly type = SnippetActionTypes.LOAD_TEMPLATES;

    constructor(public payload: string = 'LOCAL') { }
}

export class LoadSnippetsSuccessAction implements Action {
    readonly type = SnippetActionTypes.LOAD_SNIPPETS_SUCCESS;

    constructor(public payload: ISnippet[]) { }
}

export class LoadTemplatesSuccessAction implements Action {
    readonly type = SnippetActionTypes.LOAD_TEMPLATES_SUCCESS;

    constructor(public payload: ITemplate[]) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type SnippetActions
    = ViewAction
    | ImportAction
    | ImportSuccessAction
    | RunAction
    | SaveAction
    | ShareAction
    | DeleteAction
    | DeleteAllAction
    | StoreUpdatedAction
    | LoadSnippetsAction
    | LoadSnippetsSuccessAction
    | LoadTemplatesAction
    | LoadTemplatesSuccessAction
    | CreateAction;
