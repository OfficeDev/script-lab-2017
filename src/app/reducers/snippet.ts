import { createSelector } from 'reselect';
import { SnippetActions, SnippetActionTypes } from '../actions/snippet';

export interface SnippetState {
    lastOpened: ISnippet;
    loading: boolean;
    readonly: boolean;
};

const initialState: SnippetState = {
    lastOpened: null,
    loading: false,
    readonly: false
};

export function reducer(state = initialState, action: any): SnippetState {
    console.log(state, action);

    switch (action.type) {
        case SnippetActionTypes.IMPORT: {
            console.log(action.payload);
            return Object.assign({}, state, {
                loading: true
            });
        }

        case SnippetActionTypes.IMPORT_SUCCESS: {
            return {
                loading: false,
                lastOpened: action.payload,
                readonly: action.params
            };
        }

        case SnippetActionTypes.RUN: {
            return Object.assign({}, state, {
                loading: true
            });
        }

        case SnippetActionTypes.VIEW: {
            return Object.assign({}, state, {
                readonly: true
            });
        }

        case SnippetActionTypes.STORE_UPDATED: {
            return Object.assign({}, state, {
                loading: false
            });
        }

        case SnippetActionTypes.FAILED: {
            console.log(action);
            return Object.assign({}, state, {
                loading: false
            });
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
export const getReadOnly = (state: SnippetState) => state.readonly;

export const getCurrent = (state: SnippetState) => state.lastOpened;

export const getLoading = (state: SnippetState) => state.loading;
