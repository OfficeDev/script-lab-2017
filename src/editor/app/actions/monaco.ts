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
export class MonacoActionTypes {
    static readonly CHANGE_TAB = type('[Monaco] Change Tab');
    static readonly UPDATE_INTELLISENSE = type('[Monaco] Update Intellisense');
    static readonly ADD_INTELLISENSE = type('[Monaco] Add Intellisense');
    static readonly UPDATE_INTELLISENSE_SUCCESS = type('[Monaco] Update Intellisense Success');
    static readonly RESET = type('[Monaco] Reset Tab');
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ChangeTabAction implements Action {
    readonly type = MonacoActionTypes.CHANGE_TAB;

    constructor(public payload: string, public language: string) { }
}

export class ResetAction implements Action {
    readonly type = MonacoActionTypes.RESET;

    constructor() { }
}

export class UpdateIntellisenseAction implements Action {
    readonly type = MonacoActionTypes.UPDATE_INTELLISENSE;

    constructor(public payload: string[], public language: string) { }
}

export class AddIntellisenseAction implements Action {
    readonly type = MonacoActionTypes.ADD_INTELLISENSE;

    constructor(public payload: string, public language: string) { }
}

export class UpdateIntellisenseSuccessAction implements Action {
    readonly type = MonacoActionTypes.UPDATE_INTELLISENSE_SUCCESS;

    constructor() { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type MonacoActions
    = ChangeTabAction
    | ResetAction
    | UpdateIntellisenseAction
    | AddIntellisenseAction
    | UpdateIntellisenseSuccessAction;
