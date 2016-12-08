import { createSelector } from 'reselect';
import { UIActions, UIActionTypes } from '../actions/ui';
import { CONFIG } from '../../environment';
import { updateState } from '../helpers';

export interface UIState {
    menuOpened?: boolean;
    dialog?: IDialog;
    language?: string;
    theme?: boolean;
    errors?: Error[];
};

const initialState: UIState = {
    theme: false,
    menuOpened: false,
    errors: [],
    dialog: null
};

export function reducer(state = initialState, action: any): UIState {
    let newState = updateState<UIState>(state);

    switch (action.type) {
        case UIActionTypes.OPEN_MENU:
            return newState({
                menuOpened: true
            });

        case UIActionTypes.CLOSE_MENU:
            return newState({
                menuOpened: false
            });

        case UIActionTypes.SHOW_DIALOG:
            return newState({
                dialog: action.payload
            });

        case UIActionTypes.DISMISS_DIALOG:
            return newState({
                dialog: null
            });

        case UIActionTypes.CHANGE_THEME:
            return newState({
                theme: !state.theme
            });

        case UIActionTypes.REPORT_ERROR:
            return newState({
                errors: [...state.errors, action.payload]
            });

        case UIActionTypes.CHANGE_LANGUAGE:
            return newState({
                language: action.payload
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
export const getDialog = (state: UIState) => state.dialog;

export const getMenuOpened = (state: UIState) => state.menuOpened;

export const getErrors = (state: UIState) => state.errors;

export const getTheme = (state: UIState) => state.theme;
