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
    static readonly OPEN_MENU = type('[UI] Open Menu');
    static readonly CLOSE_MENU = type('[UI] Close Menu');
    static readonly SHOW_ALERT = type('[UI] Show Alert');
    static readonly DISMISS_ALERT = type('[UI] Dismiss Alert');
    static readonly TOGGLE_IMPORT = type('[UI] Toggle Import');
    static readonly CHANGE_THEME = type('[UI] Change Theme');
    static readonly CHANGE_LANGUAGE = type('[UI] Change Language');
    static readonly REPORT_ERROR = type('[UI] Report Error');
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class OpenMenuAction implements Action {
    readonly type = UIActionTypes.OPEN_MENU;

    constructor() { }
}

export class CloseMenuAction implements Action {
    readonly type = UIActionTypes.CLOSE_MENU;

    constructor() { }
}

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

    constructor(public message: string, public exception?: any) { }
}



/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type UIActions =
    ChangeThemeAction
    | ChangeLanguageAction
    | ReportErrorAction
    | OpenMenuAction
    | CloseMenuAction
    | ShowAlertAction
    | ToggleImportAction
    | DismissAlertAction;
