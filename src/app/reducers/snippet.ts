import { createSelector } from 'reselect';
import { SnippetActions, SnippetActionTypes } from '../actions/snippet';
import { updateState } from '../helpers';

export interface SnippetState {
    lastOpened?: ISnippet;
    running?: boolean;
    loading?: boolean;
    readonly?: boolean;
    snippets?: ISnippet[];
    templates?: ISnippet[];
};

const initialState: SnippetState = {
    lastOpened: null,
    loading: false,
    running: false,
    readonly: false,
    snippets: [],
    templates: []
};

export function reducer(state = initialState, action: any): SnippetState {
    let newState = updateState<SnippetState>(state);

    switch (action.type) {
        case SnippetActionTypes.IMPORT:
            return newState({
                loading: true
            });

        case SnippetActionTypes.IMPORT_SUCCESS:
            return newState({
                loading: false,
                lastOpened: action.payload,
                readonly: action.params
            });

        case SnippetActionTypes.UPDATE_INFO:
            return newState({
                lastOpened: Object.assign({}, state.lastOpened, action.payload)
            });

        case SnippetActionTypes.LOAD_SNIPPETS_SUCCESS:
            return newState({
                snippets: [...action.payload]
            });

        case SnippetActionTypes.LOAD_TEMPLATES_SUCCESS:
            return newState({
                templates: [...action.payload]
            });

        case SnippetActionTypes.CREATE:
            return newState({
                readonly: false,
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
export const getReadOnly = (state: SnippetState) => state.readonly;

export const getCurrent = (state: SnippetState) => state.lastOpened;

export const getSnippets = (state: SnippetState) => state.snippets;

export const getTemplates = (state: SnippetState) => state.templates;

export const getLoading = (state: SnippetState) => state.loading;

export const getRunning = (state: SnippetState) => state.running;
