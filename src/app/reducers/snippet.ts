import { createSelector } from 'reselect';
import { SnippetActions, SnippetActionTypes } from '../actions/snippet';
import { updateState } from '../helpers';

export interface SnippetState {
    lastOpened?: ISnippet;
    loading?: boolean;
    readonly?: boolean;
};

const initialState: SnippetState = {
    lastOpened: null,
    loading: false,
    readonly: false
};

export function reducer(state = initialState, action: any): SnippetState {
    let newState = updateState<SnippetState>(state);

    switch (action.type) {
        case SnippetActionTypes.IMPORT:
            return newState({
                loading: true
            });

        case SnippetActionTypes.IMPORT_SUCCESS: {
            return newState({
                loading: false,
                lastOpened: action.payload,
                readonly: action.params
            });
        }

        case SnippetActionTypes.RUN: {
            return newState({
                loading: true
            });
        }

        case SnippetActionTypes.VIEW: {
            return newState({
                loading: true
            });
        }

        case SnippetActionTypes.STORE_UPDATED: {
            return newState({
                loading: false
            });
        }

        case SnippetActionTypes.FAILED: {
            return newState({
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
