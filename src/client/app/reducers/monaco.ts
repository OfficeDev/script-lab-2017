import { MonacoActions, MonacoActionTypes } from '../actions/monaco';

export interface MonacoState {
    activeTab?: string;
    activeLanguage?: string;
    loading?: boolean;
}

export const initialState = {
    activeTab: null,
    activeLanguage: null,
    loading: false
};

export function reducer(state = initialState, action: MonacoActions): MonacoState {
    switch (action.type) {
        case MonacoActionTypes.CHANGE_TAB:
            return {
                ...state,
                activeTab: action.payload,
                activeLanguage: action.language
            };

        case MonacoActionTypes.RESET:
            return {
                ...state,
                activeTab: null,
                activeLanguage: null
            };

        case MonacoActionTypes.UPDATE_INTELLISENSE:
            return {
                ...state,
                loading: true
            };

        case MonacoActionTypes.UPDATE_INTELLISENSE_SUCCESS:
            return {
                ...state,
                loading: false
            };

        default: return state;
    }
};


/**
 * Because the data structure is defined within the reducer it is optimal to
 * locate our selector functions at this level. If store is to be thought of
 * as a database, and reducers the tables, selectors can be considered the
 * queries into said database. Remember to keep your selectors small and
 * focused so they can be combined and composed to fit each particular
 * use-case.
 */

export const getActiveTab = (state: MonacoState) => state.activeTab;
export const getActiveLanguage = (state: MonacoState) => state.activeLanguage;
export const getLoading = (state: MonacoState) => state.loading;
