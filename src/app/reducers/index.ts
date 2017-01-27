import { createSelector } from 'reselect';
import { combineReducers } from '@ngrx/store';

/**
 * Every reducer module's default export is the reducer function itself. In
 * addition, each module should export a type or interface that describes
 * the state of the reducer plus any selector functions. The `* as`
 * notation packages up all of the exports into a single object.
 */
import * as snippet from './snippet';
import * as monaco from './monaco';
import * as ui from './ui';
import * as github from './github';

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface State {
    snippet: snippet.SnippetState;
    monaco: monaco.MonacoState;
    ui: ui.UIState;
    github: github.GitHubState;
}

/**
 * Because metareducers take a reducer function and return a new reducer,
 * we can use our compose helper to chain them together. Here we are
 * using combineReducers to make our top level reducer, and then
 * wrapping that in storeLogger. Remember that compose applies
 * the result from right to left.
 */
const reducers = {
    snippet: snippet.reducer,
    monaco: monaco.reducer,
    ui: ui.reducer,
    github: github.reducer
};

export const rootReducer = (state: any, action: any) => combineReducers(reducers)(state, action);

const getSnippetsState = (state: State) => state.snippet;
export const getCurrent = createSelector(getSnippetsState, snippet.getCurrent);
export const getSnippets = createSelector(getSnippetsState, snippet.getSnippets);
export const getGists = createSelector(getSnippetsState, snippet.getGists);
export const getTemplates = createSelector(getSnippetsState, snippet.getTemplates);
export const getLoading = createSelector(getSnippetsState, snippet.getLoading);
export const getRunning = createSelector(getSnippetsState, snippet.getRunning);

const getMonacoState = (state: State) => state.monaco;
export const getActiveTab = createSelector(getMonacoState, monaco.getActiveTab);
export const getLanguage = createSelector(getMonacoState, monaco.getActiveLanguage);
export const getProgress = createSelector(getMonacoState, monaco.getLoading);

const getUIState = (state: State) => state.ui;
export const getMenu = createSelector(getUIState, ui.getMenuOpened);
export const getDialog = createSelector(getUIState, ui.getDialog);
export const getTheme = createSelector(getUIState, ui.getTheme);
export const getErrors = createSelector(getUIState, ui.getErrors);
export const getImportState = createSelector(getUIState, ui.getImportState);
export const getHost = createSelector(getUIState, ui.getHost);
export const getPlatform = createSelector(getUIState, ui.getPlatform);

const getGitHubState = (state: State) => state.github;
export const getProfileLoading = createSelector(getGitHubState, github.getLoading);
export const getProfile = createSelector(getGitHubState, github.getProfile);
export const getLoggedIn = createSelector(getGitHubState, github.getLoggedIn);
export const getSharing = createSelector(getGitHubState, github.getSharing);

const getSettingsState = (state: State) => ({
    lastOpened: getCurrent(state),
    profile: getProfile(state),
    theme: getTheme(state),
    language: getLanguage(state)
}) as ISettings;

export const getSettings = createSelector(state => state, getSettingsState);
export const createDefaultState = (settings: ISettings) => {
    let {profile, lastOpened, theme, language, env} = settings;
    return <State>{
        github: { ...github.initialState, profile },
        monaco: { ...monaco.initialState },
        ui: { ...ui.initialState, theme, language, env },
        snippet: { ...snippet.initialState, lastOpened }
    };
};
