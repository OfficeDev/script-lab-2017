import { UIActions, UIActionTypes } from '../actions/ui';
import { PlaygroundError, AI, environment } from '../helpers';
import { Utilities } from '@microsoft/office-js-helpers';

export interface UIState {
    menuOpened?: boolean;
    dialog?: IAlert;
    language?: string;
    theme?: boolean;
    errors?: Error[];
    showImport?: boolean;
    env?: string;
};

export const initialState: UIState = {
    theme: false,
    menuOpened: false,
    errors: [],
    dialog: null,
    showImport: false,
    env: 'PROD'
};

export function reducer(state = initialState, action: UIActions): UIState {
    AI.trackEvent(action.type);

    switch (action.type) {
        case UIActionTypes.TOGGLE_IMPORT:
            return { ...state, showImport: action.payload };

        case UIActionTypes.SHOW_ALERT:
            return { ...state, dialog: action.payload };

        case UIActionTypes.DISMISS_ALERT:
            return { ...state, dialog: null };

        case UIActionTypes.SWITCH_ENV:
            return { ...state, env: action.payload || 'PROD' };

        case UIActionTypes.CHANGE_THEME: {
            AI.trackEvent(action.type, { theme: (!state.theme) ? 'Light' : 'Dark' });
            return { ...state, theme: !state.theme };
        }

        case UIActionTypes.REPORT_ERROR: {
            let error = new PlaygroundError(action.payload, action.exception);
            if (environment.current.devMode) {
                Utilities.log(error);
            }
            return { ...state, errors: [...state.errors, error] };
        }

        case UIActionTypes.CHANGE_LANGUAGE: {
            AI.trackEvent(action.type, { language: action.payload });
            return { ...state, language: action.payload };
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
export const getDialog = (state: UIState) => state.dialog;

export const getMenuOpened = (state: UIState) => state.menuOpened;

export const getErrors = (state: UIState) => state.errors;

export const getTheme = (state: UIState) => state.theme;

export const getImportState = (state: UIState) => state.showImport;

export const getEnv = (state: UIState) => state.env;
