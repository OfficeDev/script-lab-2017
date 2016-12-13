import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { CONFIG } from '../../environment';
import { updateState } from '../helpers';

export interface GitHubState {
    isLoggedIn?: boolean;
    loading?: boolean;
    profile?: IProfile;
};

const initialState: GitHubState = {
    isLoggedIn: false,
    loading: false,
    profile: null
};

export function reducer(state = initialState, action: any): GitHubState {
    let newState = updateState<GitHubState>(state);

    switch (action.type) {
        case GitHubActionTypes.LOGIN:
            return newState({
                loading: true
            });

        case GitHubActionTypes.LOGGED_IN:
            return newState({
                loading: false,
                isLoggedIn: true,
                profile: action.payload
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

export const getLoading = (state: GitHubState) => state.loading;

export const getLoggedIn = (state: GitHubState) => state.isLoggedIn;

export const getProfile = (state: GitHubState) => state.profile;
