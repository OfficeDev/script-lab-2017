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
export const GitHubActionTypes = {
    LOGIN: type('[GitHub] Login'),
    LOGGED_IN: type('[GitHub] Logged In'),
    SHARE_GIST: type('[GitHub] Share Gist'),
    UDPATE_GIST: type('[GitHub] Update Gist')
};

/**
 * Every action is comprised of at least a type and an optional
 * payload. Expressing actions as classes enables powerful
 * type checking in reducer functions.
 *
 * See Discriminated Unions: https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
 */
export class LoginAction implements Action {
    type = GitHubActionTypes.LOGIN;

    constructor() { }
}

export class LoggedInAction implements Action {
    type = GitHubActionTypes.LOGGED_IN;

    constructor(public payload: IProfile) { }
}

export class ShareGistAction implements Action {
    type = GitHubActionTypes.SHARE_GIST;

    constructor(public payload: ISnippet) { }
}

export class UpdateGistAction implements Action {
    type = GitHubActionTypes.UDPATE_GIST;

    constructor(public payload: ISnippet) { }
}

/**
 * Export a type alias of all actions in this action group
 * so that reducers can easily compose action types
 */
export type GitHubActions
    = LoginAction
    | LoggedInAction
    | ShareGistAction
    | UpdateGistAction;
