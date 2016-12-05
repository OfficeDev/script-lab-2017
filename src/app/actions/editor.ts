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
    VIEW: type('[Editor] View'),
    IMPORT: type('[Editor] Import'),
    LOAD: type('[Editor] Load'),
    RUN: type('[Editor] Run'),
    SAVE: type('[Editor] Save'),
    SHARE: type('[Editor] Share')
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

    constructor(public payload: string) { }
}

export class LoadAction implements Action {
    type = ActionTypes.LOAD;

    constructor(public payload: ISnippet) { }
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

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type Actions
    = ViewAction
    | ImportAction
    | LoadAction
    | RunAction
    | SaveAction
    | ShareAction;
