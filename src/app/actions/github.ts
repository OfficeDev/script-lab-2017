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
    IS_LOGGED_IN: type('[Github] Is Logged In'),
    LOGGED_IN: type('[GitHub] Logged In'),
    LOGGED_OUT: type('[GitHub] Logged Out'),
    SHARE_PUBLIC_GIST: type('[GitHub] Share Public Gist'),
    SHARE_PRIVATE_GIST: type('[GitHub] Share Private Gist'),
    SHARE_COPY: type('[GitHub] Share Copy'),
    SHARE_SUCCESS: type('[GitHub] Share Success'),
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

export class LogoutAction implements Action {
    type = GitHubActionTypes.LOGGED_OUT;

    constructor() { }
}

export class IsLoggedInAction implements Action {
    type = GitHubActionTypes.IS_LOGGED_IN;

    constructor() { }
}

export class LoggedInAction implements Action {
    type = GitHubActionTypes.LOGGED_IN;

    constructor(public payload: IBasicProfile) { }
}

export class ShareCopyGistAction implements Action {
    type = GitHubActionTypes.SHARE_COPY;

    constructor(public payload: ISnippet) { }
}

export class SharePublicGistAction implements Action {
    type = GitHubActionTypes.SHARE_PUBLIC_GIST;

    constructor(public payload: ISnippet) { }
}

export class SharePrivateGistAction implements Action {
    type = GitHubActionTypes.SHARE_PRIVATE_GIST;

    constructor(public payload: ISnippet) { }
}

export class ShareSuccessAction implements Action {
    type = GitHubActionTypes.SHARE_SUCCESS;

    constructor(public payload: IGist) { }
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
    | IsLoggedInAction
    | LogoutAction
    | ShareCopyGistAction
    | SharePrivateGistAction
    | SharePublicGistAction
    | ShareSuccessAction
    | UpdateGistAction;
