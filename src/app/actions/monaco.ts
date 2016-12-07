import { Action } from '@ngrx/store';
import { type, PlaygroundError } from '../helpers';
import { Subscription } from 'rxjs/Subscription';

/**
 * For each action type in an action group, make a simple
 * enum object for all of this group's action types.
 *
 * The 'type' utility function coerces strings into string
 * literal types and runs a simple check to guarantee all
 * action types in the application are unique.
 */
export const MonacoActionTypes = {
    CHANGE_TAB: type('[Monaco] Change Tab'),
    UPDATE_INTELLISENSE: type('[Monaco] Update Intellisense'),
    ADD_INTELLISENSE: type('[Monaco] Add Intellisense'),
    UPDATE_INTELLISENSE_SUCCESS: type('[Monaco] Update Intellisense Success'),
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ChangeTabAction implements Action {
    type = MonacoActionTypes.CHANGE_TAB;

    constructor(public payload: string) { }
}

export class UpdateIntellisenseAction implements Action {
    type = MonacoActionTypes.UPDATE_INTELLISENSE;

    constructor(public payload: string[], public language: string) { }
}

export class AddIntellisenseAction implements Action {
    type = MonacoActionTypes.ADD_INTELLISENSE;

    constructor(public payload: string[], public language: string) { }
}

export class UpdateIntellisenseSuccessAction implements Action {
    type = MonacoActionTypes.UPDATE_INTELLISENSE_SUCCESS;

    constructor() { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type MonacoActions
    = ChangeTabAction
    | UpdateIntellisenseAction
    | AddIntellisenseAction
    | UpdateIntellisenseSuccessAction;
