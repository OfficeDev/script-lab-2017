import { Action } from '@ngrx/store';
import { type, PlaygroundError } from '../helpers';

/**
 * For each action type in an action group, make a simple
 * enum object for all of this group's action types.
 *
 * The 'type' utility function coerces strings into string
 * literal types and runs a simple check to guarantee all
 * action types in the application are unique.
 */
export const UIActionTypes = {
    OPEN_MENU: type('[UI] Change Tab'),
    CLOSE_MENU: type('[UI] Change Theme'),
    SHOW_ALERT: type('[UI] Change Language'),
    DISMISS_ALERT: type('[UI] Report Error'),
    INFO: type('[UI] Show Info')
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class InfoAction implements Action {
    type = UIActionTypes.INFO;

    constructor() { }
}

export class OpenMenuAction implements Action {
    type = UIActionTypes.OPEN_MENU;

    constructor() { }
}

export class CloseMenuAction implements Action {
    type = UIActionTypes.CLOSE_MENU;

    constructor() { }
}

export class ShowAlertAction implements Action {
    type = UIActionTypes.SHOW_ALERT;

    constructor(public payload: IDialog) { }
}

export class DismissAlertAction implements Action {
    type = UIActionTypes.DISMISS_ALERT;

    constructor(public payload: string) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type UIActions
    = InfoAction
    | OpenMenuAction
    | CloseMenuAction
    | ShowAlertAction
    | DismissAlertAction;
