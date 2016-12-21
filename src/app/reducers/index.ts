import { createSelector } from 'reselect';
import { ActionReducer } from '@ngrx/store';
import { compose } from '@ngrx/core/compose';
import { combineReducers } from '@ngrx/store';

/**
 * Every reducer module's default export is the reducer function itself. In
 * addition, each module should export a type or interface that describes
 * the state of the reducer plus any selector functions. The `* as`
 * notation packages up all of the exports into a single object.
 */
import * as snippets from './snippet';
import * as monaco from './monaco';
import * as ui from './ui';
import * as github from './github';

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface State {
    snippet: snippets.SnippetState;
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
    snippet: snippets.reducer,
    monaco: monaco.reducer,
    ui: ui.reducer,
    github: github.reducer
};

export const rootReducer = (state: any, action: any) => combineReducers(reducers)(state, action);

const getSnippetsState = (state: State) => state.snippet;
export const getReadOnly = createSelector(getSnippetsState, snippets.getReadOnly);
export const getCurrent = createSelector(getSnippetsState, snippets.getCurrent);
export const getSnippets = createSelector(getSnippetsState, snippets.getSnippets);
export const getGists = createSelector(getSnippetsState, snippets.getGists);
export const getTemplates = createSelector(getSnippetsState, snippets.getTemplates);
export const getLoading = createSelector(getSnippetsState, snippets.getLoading);
export const getRunning = createSelector(getSnippetsState, snippets.getRunning);

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

const getGitHubState = (state: State) => state.github;
export const getProfileLoading = createSelector(getGitHubState, github.getLoading);
export const getProfile = createSelector(getGitHubState, github.getProfile);
export const getLoggedIn = createSelector(getGitHubState, github.getLoggedIn);
export const getSharing = createSelector(getGitHubState, github.getSharing);
