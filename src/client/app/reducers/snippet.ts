import { SnippetActions, SnippetActionTypes } from '../actions/snippet';
import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { AI } from '../helpers';
import * as sha1 from 'crypto-js/sha1';

export interface SnippetState {
    lastOpened?: ISnippet;
    running?: boolean;
    loading?: boolean;
    snippets?: ISnippet[];
    gists?: ISnippet[];
    templates?: ISnippet[];
};

export const initialState: SnippetState = {
    lastOpened: null,
    loading: false,
    running: false,
    snippets: [],
    gists: [],
    templates: []
};

export function reducer(state = initialState, action: SnippetActions | GitHubActions): SnippetState {
    switch (action.type) {
        case SnippetActionTypes.IMPORT:
            return { ...state, loading: false };

        case SnippetActionTypes.IMPORT_SUCCESS:
            return {
                ...state,
                loading: false,
                lastOpened: action.payload,
            };

        case SnippetActionTypes.LOAD_SNIPPETS_SUCCESS:
            return { ...state, snippets: action.payload };

        case SnippetActionTypes.LOAD_TEMPLATES_SUCCESS:
            return { ...state, templates: action.payload };

        case GitHubActionTypes.LOAD_GISTS_SUCCESS:
            return { ...state, gists: action.payload };

        case SnippetActionTypes.CREATE:
            AI.trackEvent(action.type, { id: action.payload.id });
            return {
                ...state,
                external: false,
                lastOpened: action.payload
            };

        case SnippetActionTypes.SAVE:
            return { ...state, lastOpened: action.payload };

        case SnippetActionTypes.DELETE: {
            AI.trackEvent(action.type, { id: action.payload });

            let clear = false;
            if (state.lastOpened && state.lastOpened.id === action.payload) {
                clear = true;
            }

            return { ...state, lastOpened: clear ? null : state.lastOpened };
        }

        case SnippetActionTypes.DELETE_ALL: {
            AI.trackEvent(action.type);
            return { ...state, lastOpened: null };
        }

        case SnippetActionTypes.RUN: {
            AI.trackEvent(action.type, { id: action.payload.id });
            return { ...state, running: true };
        }

        case SnippetActionTypes.VIEW: {
            AI.trackEvent(action.type, { id: action.payload.id });
            return { ...state, loading: false };
        }

        case SnippetActionTypes.STORE_UPDATED:
            return { ...state, loading: false };

        case SnippetActionTypes.UPDATE_INFO: {
            let updatedInfo = { };
            if (action.payload.gist != null) {
                updatedInfo['gistHashedId'] = sha1(action.payload.gist.toString());
            }

            AI.trackEvent(action.type, updatedInfo);
            return { ...state, loading: false };
        }

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
export const getCurrent = (state: SnippetState) => state.lastOpened;

export const getSnippets = (state: SnippetState) => state.snippets;

export const getGists = (state: SnippetState) => state.gists;

export const getTemplates = (state: SnippetState) => state.templates;

export const getLoading = (state: SnippetState) => state.loading;

export const getRunning = (state: SnippetState) => state.running;
