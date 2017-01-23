import { UIActions, UIActionTypes } from '../actions/ui';
import { PlaygroundError, AI } from '../helpers';
import { Utilities } from '@microsoft/office-js-helpers';
import { Environment } from '../../environment';

export interface UIState {
    menuOpened?: boolean;
    dialog?: IAlert;
    language?: string;
    theme?: boolean;
    errors?: Error[];
    showImport?: boolean;
    host?: string;
    platform?: string
};

export const initialState: UIState = {
    theme: false,
    menuOpened: false,
    errors: [],
    dialog: null,
    showImport: false,
    host: Utilities.host,
    platform: Utilities.platform
};

export function reducer(state = initialState, action: UIActions): UIState {
    AI.trackEvent(action.type);

    switch (action.type) {
        case UIActionTypes.OPEN_MENU:
            return { ...state, menuOpened: true };

        case UIActionTypes.CLOSE_MENU:
            return { ...state, menuOpened: false };

        case UIActionTypes.TOGGLE_IMPORT:
            return { ...state, showImport: action.payload };

        case UIActionTypes.SHOW_ALERT:
            return { ...state, dialog: action.payload };

        case UIActionTypes.DISMISS_ALERT:
            return { ...state, dialog: null };

        case UIActionTypes.CHANGE_THEME: {
            AI.trackEvent(action.type, { theme: (!state.theme) ? 'Light' : 'Dark' });
            return { ...state, theme: !state.theme };
        }

        case UIActionTypes.REPORT_ERROR: {
            let error = new PlaygroundError(action.message, action.exception);
            if (Environment.env === 'DEVELOPMENT') {
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

export const getHost = (state: UIState) => state.host;

export const getPlatform = (state: UIState) => state.platform;
