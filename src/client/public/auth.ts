import { Authenticator, UI } from '@microsoft/office-js-helpers';
import { Strings } from '../app/strings';
import { environment, generateUrl } from '../app/helpers/';

import '../assets/styles/extras.scss';


const AuthRequestSessionStorageKey = 'auth_request';
const AuthorizeUrlMap = {
    'graph': 'https://login.windows.net/common/oauth2/authorize'
};
const LogoutUrlMap = {
    'graph': 'https://login.windows.net/common/oauth2/logout'
};
const ResourceMap = {
    'graph': 'https://graph.microsoft.com'
};

const ActionParamName: keyof AuthRequestParamData = 'auth_action';
const ServiceParamName: keyof AuthRequestParamData = 'service';
const ClientIdParamName: keyof AuthRequestParamData = 'client_id';


let strings: ClientStrings;

tryCatch(() => {
    strings = Strings();

    document.title = strings.playgroundName + ' - ' + strings.Auth.authenticationRedirect;

    let authRequestParams: AuthRequestParamData = Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    let hasActionAndServiceAndClientIdInfo =
        authRequestParams[ActionParamName] &&
        authRequestParams[ServiceParamName] &&
        authRequestParams[ClientIdParamName];

    if (!hasActionAndServiceAndClientIdInfo && window.sessionStorage[AuthRequestSessionStorageKey]) {
        authRequestParams = JSON.parse(window.sessionStorage[AuthRequestSessionStorageKey]);
    }

    if (typeof authRequestParams.is_office_host === 'string') {
        authRequestParams.is_office_host =
            ((authRequestParams.is_office_host as any) as string).toLowerCase() === 'true';
    }

    // At this point, should have a client ID & service info
    if (!authRequestParams.auth_action || !authRequestParams.client_id || !authRequestParams.service) {
        throw new Error(strings.Auth.invalidParametersPassedInForAuth);
    }


    if (authRequestParams.auth_action === 'login') {
        setSubtitleText(strings.Auth.authenticatingOnBehalfOfSnippet);
    }
    else if (authRequestParams.auth_action === 'logout') {
        setSubtitleText(strings.Auth.loggingOutOnBehalfOfSnippet);
    }


    if (authRequestParams.is_office_host) {
        // Wait for Office.initialize before proceeding with the flow
        Office.initialize = () => proceedWithAuthInit(authRequestParams);
    } else {
        proceedWithAuthInit(authRequestParams);
    }
});

function proceedWithAuthInit(authRequest: AuthRequestParamData) {
    tryCatch(() => {
        // Expect to either have the original "action" and "service" and "client_id" parameters (start),
        // or an "access_token" or "error" parameter (for oauth completion; see below)
        // https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/

        if (!authRequest) {
            throw new Error(strings.unexpectedError);
        }

        if (authRequest.auth_action === 'login') {
            const hasHash = window.location.href.indexOf('#') > 0;
            if (hasHash) {
                const authResponseKeyValues = Authenticator.extractParams(window.location.href.split('#')[1]);
                const accessToken = authResponseKeyValues['access_token'];
                if (accessToken) {
                    if (authRequest.is_office_host) {
                        Office.context.ui.messageParent('AUTH:access_token=' + accessToken);
                    } else {
                        if (window.opener) {
                            window.opener.postMessage('AUTH:access_token=' + accessToken, environment.current.config.runnerUrl);
                        } else {
                            setSubtitleText(strings.Auth.yourAccessTokenIs);
                            const accessTokenInputBox = (document.getElementById('access-token-if-no-redirect') as HTMLInputElement);
                            accessTokenInputBox.value = accessToken;
                            accessTokenInputBox.style.visibility = 'visible';
                            accessTokenInputBox.focus();
                            accessTokenInputBox.setSelectionRange(0, accessTokenInputBox.value.length);
                            hideProgressFooter();
                        }
                    }

                    return;
                } else if (authResponseKeyValues['error']) {
                    throw new Error(authResponseKeyValues['error'] + ': ' + authResponseKeyValues['error_description']);
                } else {
                    throw new Error(strings.Auth.invalidAuthResponseReceived);
                }
            }

            if (authRequest[ServiceParamName] && authRequest[ClientIdParamName]) {
                let authorizeUrl = AuthorizeUrlMap[authRequest.service];
                let resource = ResourceMap[authRequest.service];
                if (!authorizeUrl || !resource) {
                    throw new Error(`${strings.Auth.unrecognizedService} "${authRequest.service}"`);
                }

                window.sessionStorage[AuthRequestSessionStorageKey] = JSON.stringify(authRequest);
                const url = generateUrl(authorizeUrl, {
                    'response_type': 'token',
                    'client_id': authRequest.client_id,
                    'resource': resource,
                    'redirect_uri': getCurrentPageBaseUrl()
                });
                window.location.assign(url);

                return;
            }
        }
        else if (authRequest.auth_action === 'logout') {
            if (authRequest[ServiceParamName] && authRequest[ClientIdParamName]) {
                let logoutUrl = LogoutUrlMap[authRequest.service];
                let resource = ResourceMap[authRequest.service];
                if (!logoutUrl || !resource) {
                    throw new Error(`${strings.Auth.unrecognizedService} "${authRequest.service}"`);
                }

                window.sessionStorage[AuthRequestSessionStorageKey] = JSON.stringify(authRequest);
                const url = generateUrl(logoutUrl, {
                    'client_id': authRequest.client_id
                });
                window.location.assign(url);

                return;
            }
        }

        throw new Error(strings.unexpectedError);
    });
}

function getCurrentPageBaseUrl() {
    let currentPageUrl = document.URL;
    ['?', '#'].forEach(item => {
        let index = currentPageUrl.indexOf(item);
        if (index > 0) {
            currentPageUrl = currentPageUrl.substr(0, index);
        }
    });

    if (currentPageUrl.substr(currentPageUrl.length - 1) === '/') {
        currentPageUrl = currentPageUrl.substr(0, currentPageUrl.length - 1);
    }

    return currentPageUrl;
}

function tryCatch(callback: () => void) {
    try {
        callback();
    } catch (e) {
        hideProgressFooter();
        UI.notify(strings.Auth.authenticationError, e);
    }
}

function hideProgressFooter() {
    (document.getElementsByClassName('ms-progress-component__footer')[0] as HTMLDivElement).style.visibility = 'hidden';
}

function setSubtitleText(text) {
    const element = document.getElementById('subtitle');
    element.textContent = text;
    element.style.visibility = 'visible';
}
