import { GitHubActions, GitHubActionTypes } from '../actions/github';
import { updateState, AI } from '../helpers';

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

export function defaultState(overrides?: GitHubState) {
    return { ...initialState, ...overrides } as GitHubState;
}

export function reducer(state = initialState, action: GitHubActions): GitHubState {
    let newState = updateState<GitHubState>(state);
    let type = action.type;

    switch (action.type) {
        case GitHubActionTypes.LOGIN: {
            AI.current.trackEvent(type);
            return newState({
                loading: true
            });
        }

        case GitHubActionTypes.LOGGED_IN: {
            AI.current.setAuthenticatedUserContext(action.payload.id.toString(), action.payload.login);

            return newState({
                loading: false,
                isLoggedIn: true,
                profile: action.payload
            });
        }

        case GitHubActionTypes.LOGGED_OUT: {
            AI.current.trackEvent(type);

            return newState({
                loading: false,
                isLoggedIn: false,
                profile: null
            });
        }

        case GitHubActionTypes.SHARE_PRIVATE_GIST:
        case GitHubActionTypes.SHARE_PUBLIC_GIST: {
            AI.current.trackEvent(type);
            return newState({
                sharing: true
            });
        }

        case GitHubActionTypes.SHARE_SUCCESS: {
            AI.current.trackEvent(type, action.payload.public ? action.payload as any : null);
            return newState({
                sharing: false
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

export const getLoading = (state: GitHubState) => state.loading;

export const getLoggedIn = (state: GitHubState) => state.isLoggedIn;

export const getProfile = (state: GitHubState) => state.profile;

export const getSharing = (state: GitHubState) => state.sharing;
