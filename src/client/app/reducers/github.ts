import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { AI } from '../helpers';
import * as sha1 from 'crypto-js/sha1';

export interface GitHubState {
    isLoggedIn?: boolean;
    loading?: boolean;
    profile?: IBasicProfile;
    sharing?: boolean;
};

export const initialState: GitHubState = {
    isLoggedIn: false,
    loading: false,
    profile: null,
    sharing: false
};

export function reducer(state = initialState, action: GitHubActions): GitHubState {
    switch (action.type) {
        case GitHubActionTypes.LOGIN: {
            AI.trackEvent(action.type);
            return { ...state, loading: true };
        }

        case GitHubActionTypes.LOGIN_FAILED: {
            return { ...state, loading: false };
        }

        case GitHubActionTypes.LOGGED_IN: {
            AI.trackEvent('LoggedIn', { githubHashedId: sha1(action.payload.id.toString()).toString() });
            return {
                ...state,
                loading: false,
                isLoggedIn: true,
                profile: action.payload
            };
        }

        case GitHubActionTypes.LOGGED_OUT: {
            AI.trackEvent(action.type);
            return {
                ...state,
                loading: false,
                isLoggedIn: false,
                profile: null
            };
        }

        case GitHubActionTypes.SHARE_PRIVATE_GIST:
        case GitHubActionTypes.SHARE_PUBLIC_GIST: {
            AI.trackEvent(action.type);
            return { ...state, sharing: true };
        }

        case GitHubActionTypes.SHARE_SUCCESS: {
            AI.trackEvent(action.type, action.payload.public ? action.payload as any : null);
            return { ...state, sharing: false };
        }

        case GitHubActionTypes.SHARE_FAILED: {
            return { ...state, sharing: false };
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

export const getLoading = (state: GitHubState) => state.loading;

export const getLoggedIn = (state: GitHubState) => state.isLoggedIn;

export const getProfile = (state: GitHubState) => state.profile;

export const getSharing = (state: GitHubState) => state.sharing;
