import { createSelector } from 'reselect';
import { Utilities, Storage } from '@microsoft/office-js-helpers';
import { Actions, ActionTypes } from '../actions/snippets';
import { SnippetStore } from '../services';

export interface IEditorState {
    lastOpened: string;
    snippets: Storage<ISnippet>;
    readonly: boolean;
};

const initialState: IEditorState = {
    lastOpened: null,
    snippets: new Storage<ISnippet>(`${Utilities.host} Snippets`),
    readonly: false
};

export function reducer(state = initialState, action: Actions): IEditorState {
    switch (action.type) {
        case ActionTypes.IMPORT:

        case ActionTypes.IMPORT_SUCCESS:

        case ActionTypes.RUN:

        case ActionTypes.SAVE:

        case ActionTypes.SHARE:

        case ActionTypes.VIEW:

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
export const getReadOnly = (state: IEditorState) => state.readonly;

export const getSnippets = (state: IEditorState) => state.snippets;

export const getLastOpened = (state: IEditorState) => state.lastOpened;

export const getCurrent = createSelector(getSnippets, getLastOpened, (snippets, lastOpened) => snippets.get(lastOpened));

export const getSnippetsLookup = (state: IEditorState) => state.snippets.lookup();
