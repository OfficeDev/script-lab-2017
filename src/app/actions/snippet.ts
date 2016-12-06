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
export const ActionTypes = {
    VIEW: type('[Snippets] View'),
    IMPORT: type('[Snippets] Import'),
    IMPORT_SUCCESS: type('[Snippets] Import Successful'),
    RUN: type('[Snippets] Run'),
    SAVE: type('[Snippets] Save'),
    SHARE: type('[Snippets] Share'),
    DELETE: type('[Snippets] Delete'),
    DELETE_ALL: type('[Snippets] Delete All'),
    STORE_UPDATED: type('[Snippets] Storage Updated'),
    FAILED: type('[Snippets] Failed')
};


/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ViewAction implements Action {
    type = ActionTypes.VIEW;

    constructor(public payload: ISnippet) { }
}

export class ImportAction implements Action {
    type = ActionTypes.IMPORT;

    constructor(public payload: string, public params: string = '') { }
}

export class ImportSuccess implements Action {
    type = ActionTypes.IMPORT_SUCCESS;

    constructor(public payload: ISnippet, public params: boolean) { }
}

export class RunAction implements Action {
    type = ActionTypes.RUN;

    constructor(public payload: ISnippet) { }
}

export class SaveAction implements Action {
    type = ActionTypes.SAVE;

    constructor(public payload: ISnippet) { }
}

export class ShareAction implements Action {
    type = ActionTypes.SHARE;

    constructor(public payload: ISnippet) { }
}

export class DeleteAction implements Action {
    type = ActionTypes.DELETE;

    constructor(public payload: string) { }
}

export class DeleteAllAction implements Action {
    type = ActionTypes.DELETE_ALL;

    constructor() { }
}

export class StoreUpdated implements Action {
    type = ActionTypes.STORE_UPDATED;

    constructor() { }
}

export class FailedAction implements Action {
    type = ActionTypes.FAILED;

    constructor(payload: Error) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type Actions
    = ViewAction
    | ImportAction
    | ImportSuccess
    | RunAction
    | SaveAction
    | ShareAction
    | DeleteAction
    | DeleteAllAction
    | FailedAction
    | StoreUpdated;
