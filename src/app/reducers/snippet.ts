import { createSelector } from 'reselect';
import { Actions, ActionTypes } from '../actions/snippet';

export interface State {
    lastOpened: ISnippet;
    loading: boolean;
    readonly: boolean;
};

const initialState: State = {
    lastOpened: null,
    loading: false,
    readonly: false
};

export function reducer(state = initialState, action: any): State {
    switch (action.type) {
        case ActionTypes.IMPORT: {
            console.log(action.payload);
            return Object.assign({}, state, {
                loading: true
            });
        }

        case ActionTypes.IMPORT_SUCCESS: {
            return {
                loading: false,
                lastOpened: action.payload,
                readonly: action.params
            };
        }

        case ActionTypes.RUN: {
            return Object.assign({}, state, {
                loading: true
            });
        }

        case ActionTypes.VIEW: {
            return Object.assign({}, state, {
                readonly: true
            });
        }

        case ActionTypes.STORE_UPDATED: {
            return Object.assign({}, state, {
                loading: false
            });
        }

        case ActionTypes.FAILED: {
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
export const getReadOnly = (state: State) => state.readonly;

export const getCurrent = (state: State) => state.lastOpened;

export const getLoading = (state: State) => state.loading;
