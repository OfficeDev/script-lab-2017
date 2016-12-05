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
import * as fromEditor from './editor';

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface State {
    editor: fromEditor.IEditorState;
}

/**
 * Because metareducers take a reducer function and return a new reducer,
 * we can use our compose helper to chain them together. Here we are
 * using combineReducers to make our top level reducer, and then
 * wrapping that in storeLogger. Remember that compose applies
 * the result from right to left.
 */
const reducers = {
    editor: fromEditor.reducer,
};

export function reducer(state: any, action: any) {
    return combineReducers(reducers)(state, action);
}

export const getEditorState = (state: State) => state.editor;
export const getReadOnly = createSelector(getEditorState, fromEditor.getReadOnly);
export const getSnippets = createSelector(getEditorState, fromEditor.getSnippets);
export const getSnippetsLookup = createSelector(getEditorState, fromEditor.getSnippetsLookup);
export const getLastOpened = createSelector(getEditorState, fromEditor.getLastOpened);
export const getCurrent = createSelector(getEditorState, fromEditor.getCurrent);
