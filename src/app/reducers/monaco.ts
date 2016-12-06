import { createSelector } from 'reselect';
import { Dictionary } from '@microsoft/office-js-helpers';
import { MonacoActions, MonacoActionTypes } from '../actions/monaco';
import { updateState } from '../helpers';

export interface MonacoState {
    activeTab?: string;
    language?: string;
    theme?: string;
    loading?: boolean;
    errors?: Error[];
}

const initialState = {
    activeTab: null,
    activeLanguage: null,
    activeTheme: 'vs',
    loading: false,
    errors: []
};

export function reducer(state = initialState, action: any): MonacoState {
    let newState = updateState<MonacoState>(state);

    switch (action.type) {
        case MonacoActionTypes.CHANGE_LANGUAGE:
            return newState({
                language: action.payload
            });

        case MonacoActionTypes.CHANGE_TAB:
            return newState({
                activeTab: action.payload
            });

        case MonacoActionTypes.CHANGE_THEME:
            return newState({
                theme: action.payload || 'vs'
            });

        case MonacoActionTypes.REPORT_ERROR:
            return newState({
                errors: [...state.errors, action.payload]
            });

        case MonacoActionTypes.UPDATE_INTELLISENSE:
            return newState({
                loading: true
            });

        case MonacoActionTypes.UPDATE_INTELLISENSE_SUCCESS:
            return newState({
                loading: false
            });

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

export const getActiveLanguage = (state: MonacoState) => state.language;

export const getErrors = (state: MonacoState) => state.errors;

export const getTheme = (state: MonacoState) => state.theme;
