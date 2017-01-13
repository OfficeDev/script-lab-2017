import { createSelector } from 'reselect';
import { SnippetActions, SnippetActionTypes } from '../actions/snippet';
import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { updateState, AI } from '../helpers';

export interface SnippetState {
    lastOpened?: ISnippet;
    running?: boolean;
    loading?: boolean;
    external?: boolean;
    snippets?: ISnippet[];
    gists?: ISnippet[];
    templates?: ISnippet[];
};

const initialState: SnippetState = {
    lastOpened: null,
    loading: false,
    running: false,
    external: false,
    snippets: [],
    gists: [],
    templates: []
};

export function defaultState(overrides?: SnippetState) {
    return { ...initialState, ...overrides } as SnippetState;
}

export function reducer(state = initialState, action: SnippetActions | GitHubActions): SnippetState {
    let newState = updateState<SnippetState>(state);
    let type = action.type.toUpperCase();
    AI.trackEvent(action.type, { type: JSON.stringify(action) });

    switch (action.type) {
        case SnippetActionTypes.IMPORT:
            return newState({
                loading: true
            });

        case SnippetActionTypes.IMPORT_SUCCESS:
            return newState({
                loading: false,
                lastOpened: action.payload,
                external: action.external
            });

        case SnippetActionTypes.LOAD_SNIPPETS_SUCCESS:
            return newState({
                snippets: [...action.payload]
            });

        case SnippetActionTypes.LOAD_TEMPLATES_SUCCESS:
            return newState({
                templates: [...action.payload]
            });

        case GitHubActionTypes.LOAD_GISTS_SUCCESS:
            return newState({
                gists: [...action.payload]
            });

        case SnippetActionTypes.CREATE:
            return newState({
                external: false,
                lastOpened: action.payload
            });

        case SnippetActionTypes.SAVE:
            return newState({
                lastOpened: action.payload
            });

        case SnippetActionTypes.DELETE: {
            let clear = false;
            if (state.lastOpened && state.lastOpened.id === action.payload) {
                clear = true;
            }

            return newState({
                lastOpened: clear ? null : state.lastOpened
            });
        }

        case SnippetActionTypes.DELETE_ALL:
            return newState({
                lastOpened: null
            });

        case SnippetActionTypes.RUN:
            return newState({
                running: true
            });


        case SnippetActionTypes.VIEW:
            return newState({
                loading: true
            });


        case SnippetActionTypes.STORE_UPDATED:
            return newState({
                loading: false
            });


        default: return state;
    }
}

/**
 * Because the data structure is defined within the reducer it is optimal to
 * locate our selector functions at this level. If store is to be thought of
 * as a database, and reducers the tables, selectors can be considered the
 * queries into said database. Remember to keep your selectors small and
 * focused so they can be combined and composed to fit each particular
 * use-case.
 */
export const getExternal = (state: SnippetState) => state.external;

export const getCurrent = (state: SnippetState) => state.lastOpened;

export const getSnippets = (state: SnippetState) => state.snippets;

export const getGists = (state: SnippetState) => state.gists;

export const getTemplates = (state: SnippetState) => state.templates;

export const getLoading = (state: SnippetState) => state.loading;

export const getRunning = (state: SnippetState) => state.running;
