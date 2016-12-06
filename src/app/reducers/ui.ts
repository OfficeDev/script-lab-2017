import { createSelector } from 'reselect';
import { UIActions, UIActionTypes } from '../actions/ui';
import { CONFIG } from '../../environment';
import { updateState } from '../helpers';

export interface UIState {
    menuOpened?: ISnippet;
    alert?: IDialog;
    config?: typeof CONFIG
};

const initialState: UIState = {
    menuOpened: false,
    alert: null,
    config: CONFIG
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

        case UIActionTypes.SHOW_ALERT:
            return newState({
                alert: action.payload
            });

        case UIActionTypes.DISMISS_ALERT: {
            return newState({
                alert: null
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
export const getAlert = (state: UIState) => state.alert;

export const getConfig = (state: UIState) => state.config;

export const getMenuOpened = (state: UIState) => state.menuOpened;
