import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { updateState } from '../helpers';

export interface GitHubState {
    isLoggedIn?: boolean;
    loading?: boolean;
    profile?: IBasicProfile;
    sharing?: boolean;
};

const initialState: GitHubState = {
    isLoggedIn: false,
    loading: false,
    profile: null,
    sharing: false
};

export function reducer(state = initialState, action: GitHubActions): GitHubState {
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

        case GitHubActionTypes.LOGGED_OUT:
            return newState({
                loading: false,
                isLoggedIn: false,
                profile: null
            });

        case GitHubActionTypes.SHARE_PRIVATE_GIST:
        case GitHubActionTypes.SHARE_PUBLIC_GIST:
            return newState({
                sharing: true
            });

        case GitHubActionTypes.SHARE_SUCCESS:
            return newState({
                sharing: false
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

export const getSharing = (state: GitHubState) => state.sharing;
