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
export class UIActionTypes {
    static readonly SHOW_ALERT = type('[UI] Show Alert');
    static readonly SWITCH_ENV = type('[UI] Switch Env');
    static readonly DISMISS_ALERT = type('[UI] Dismiss Alert');
    static readonly TOGGLE_IMPORT = type('[UI] Toggle Import');
    static readonly CHANGE_THEME = type('[UI] Change Theme');
    static readonly CHANGE_LANGUAGE = type('[UI] Change Language');
    static readonly REPORT_ERROR = type('[UI] Report Error');
    static readonly DISMISS_ALL_ERRORS = type('[UI] Dismiss All Errors');
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class ShowAlertAction implements Action {
    readonly type = UIActionTypes.SHOW_ALERT;

    constructor(public payload: IAlert) { }
}

export class ToggleImportAction implements Action {
    readonly type = UIActionTypes.TOGGLE_IMPORT;

    constructor(public payload: boolean) { }
}

export class DismissAlertAction implements Action {
    readonly type = UIActionTypes.DISMISS_ALERT;

    constructor(public payload: string) { }
}

export class ChangeThemeAction implements Action {
    readonly type = UIActionTypes.CHANGE_THEME;

    constructor(public light?: boolean) { }
}

export class ChangeLanguageAction implements Action {
    readonly type = UIActionTypes.CHANGE_LANGUAGE;

    constructor(public payload: string) { }
}

export class ReportErrorAction implements Action {
    readonly type = UIActionTypes.REPORT_ERROR;

    constructor(public payload: string, public exception?: any) { }
}

export class DismissAllErrorsAction implements Action {
    readonly type = UIActionTypes.DISMISS_ALL_ERRORS;

    constructor() { }
}

export class SwitchEnvAction implements Action {
    readonly type = UIActionTypes.SWITCH_ENV;

    constructor(public payload: string) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type UIActions =
    ChangeThemeAction
    | ChangeLanguageAction
    | ReportErrorAction
    | ShowAlertAction
    | ToggleImportAction
    | DismissAlertAction
    | DismissAllErrorsAction
    | SwitchEnvAction;
