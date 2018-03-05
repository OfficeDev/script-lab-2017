/* tslint:disable:no-namespace */

// NOTE: At initialization, the ScriptLab namespace also expects
//       to be passed in a "._strings" object
//       It is not listed on the namespace, however, to avoid polluting generated d.ts

// TODO: switch to the dialog functionality of OfficeJsHelpers (which has benefits
// like caching of access token, better testing / security review, etc.).  But, some gaps:
// - Need logout
// - String localizations


/** [PREVIEW] A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    const CODE_DIALOG_CLOSED_BY_USER = 12006;

    const cachedAuthTokens: {
        [clientIdAndResource: string]: {
            token: string;
            expiry: number;
        }
    } = {};

    let _initializationParams: { snippet: { id: string } };

    /** DO NOT CALL THIS METHOD, INTERNAL USE ONLY.
     */
    export function _init(params: { snippet: { id: string } }) {
        _initializationParams = params;
    }

    /** [PREVIEW] Gets an access token on behalf of the user for Microsoft Graph using a default Script Lab registration
     */
    export function getAccessToken();

    /** [PREVIEW] Gets an access token on behalf of the user for a particular service
     * @param clientId: The client id for the AAD app you wish to get a token for.
     * @param resource: [optional] The resource provider (default: 'graph' = Microsoft Graph; but could also be custom URI)
     */
    export function getAccessToken(clientId: string, resource?: 'graph' | string);

    export function getAccessToken(clientId?: string, resource?: string): Promise<string> {
        if (!resource) {
            resource = 'graph';
        }

        if (!clientId) {
            clientId = 'default';
        }

        const cachedAccessToken = _getCachedAccessToken(clientId, resource);
        if (cachedAccessToken) {
            return Promise.resolve(cachedAccessToken);
        } else {
            if (_isPlainWeb()) {
                return _getAccessTokenViaWindowOpen(clientId, resource);
            }
            if (_isDialogApiSupported()) {
                return _getAccessTokenViaDialogApi(clientId, resource);
            }
            throw new Error((ScriptLab as any)._strings.officeVersionDoesNotSupportAuthentication);
        }
    }

    /** [PREVIEW] Log the user out of a service
     * @param resource: The resource provider (default: 'graph' = Microsoft Graph; but could also be custom URI)
    */
    export function logout(clientId: string, resource: string): Promise<any> {
        _removeCachedAccessToken(clientId, resource);
        if (_isPlainWeb()) {
            return _logoutViaWindowOpen(clientId, resource);
        } else if (_isDialogApiSupported()) {
            return _logoutViaDialogApi(clientId, resource);
        } else {
            throw new Error((ScriptLab as any)._strings.officeVersionDoesNotSupportAuthentication);
        }
    }

    function _getAccessTokenViaWindowOpen(clientId: string, resource: string): Promise<string> {
        return new Promise((resolve, reject) => {

            let authDialog = window.open(
                _generateAuthUrl({ auth_action: 'login', client_id: clientId, resource: resource, is_office_host: false }),
                '_blank',
                'width=1024,height=768'
            );
            window.addEventListener('message', accessTokenMessageListener);

            const dialogCloseWatcher = setInterval(() => {
                if (!authDialog || authDialog.closed) {
                    clearInterval(dialogCloseWatcher);
                    reject(new Error((ScriptLab as any)._strings.authenticationWasCancelledByTheUser));
                }
            }, 1000);

            function accessTokenMessageListener(event: MessageEvent) {
                if (event.origin !== window.location.origin) {
                    return;
                }
                if (typeof event.data !== 'string') {
                    return;
                }
                let message;
                try {
                    message = JSON.parse(event.data);
                    if (message.type === 'auth') {
                        window.removeEventListener('message', accessTokenMessageListener);
                        resolve(_extractAndCacheAccessToken(message.message, clientId, resource));
                        authDialog.close();
                        return;
                    }
                }
                catch (exception) {
                }

                if (event.data.indexOf('AUTH:error=') === 0) {
                    window.removeEventListener('message', accessTokenMessageListener);
                    reject(new Error(event.data.substr('AUTH:error='.length)));
                    authDialog.close();
                    return;
                }
            }
        });
    }

    function _getAccessTokenViaDialogApi(clientId: string, resource: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Office.context.ui.displayDialogAsync(
                _generateAuthUrl({ auth_action: 'login', client_id: clientId, resource: resource, is_office_host: true }),
                { height: 50, width: 50 },
                result => {
                    if (result.status !== Office.AsyncResultStatus.Succeeded) {
                        reject(new Error(result.error.message));
                        return;
                    }

                    let dialog: Office.DialogHandler = result.value;
                    dialog.addEventHandler(Office.EventType.DialogEventReceived, event => {
                        switch (event.error) {
                            case CODE_DIALOG_CLOSED_BY_USER:
                                reject(new Error((ScriptLab as any)._strings.authenticationWasCancelledByTheUser));
                                return;
                            default:
                                reject(new Error(event.message));
                                return;
                        }
                    });

                    dialog.addEventHandler(Office.EventType.DialogMessageReceived, args => {
                        try {
                            if (typeof args.message !== 'string') {
                                throw new Error(); // to be caught below
                            }
                            let message;
                            try {
                                message = JSON.parse(args.message);
                                if (message.type === 'auth') {
                                    resolve(_extractAndCacheAccessToken(message.message, clientId, resource));
                                    dialog.close();
                                }
                            }
                            catch (exception) {
                            }

                            if (args.message.indexOf('AUTH:error=') === 0) {
                                reject(new Error(args.message.substr('AUTH:error='.length)));
                                dialog.close();
                            }
                        }
                        catch (exception) {
                            reject((ScriptLab as any)._strings.unexpectedError);
                            dialog.close();
                        }
                    });
                }
            );
        });
    }

    function _logoutViaWindowOpen(clientId: string, resource: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let authDialog = window.open(
                _generateAuthUrl({ auth_action: 'logout', client_id: clientId, resource: resource, is_office_host: false }),
                '_blank',
                'width=1024,height=768'
            );

            // Wait until the window is closed before resolving (and assume that closed = good enough,
            // i.e., that it probably did succeed in logging out)
            const dialogCloseWatcher = setInterval(() => {
                if (!authDialog || authDialog.closed) {
                    clearInterval(dialogCloseWatcher);
                    resolve();
                }
            }, 1000);

            // Note: not hooking up message listener because in the case of logout,
            // not expecting to be messaged back (end up on logout page, not back on the app's turf).
        });
    }

    function _logoutViaDialogApi(clientId: string, resource: string): Promise<any> {
        return new Promise((resolve, reject) => {
            Office.context.ui.displayDialogAsync(
                _generateAuthUrl({ auth_action: 'logout', client_id: clientId, resource: resource, is_office_host: true }),
                { height: 50, width: 50 },
                result => {
                    if (result.status !== Office.AsyncResultStatus.Succeeded) {
                        reject(new Error(result.error.message));
                        return;
                    }

                    let dialog: Office.DialogHandler = result.value;
                    dialog.addEventHandler(Office.EventType.DialogEventReceived, event => {
                        switch (event.error) {
                            case CODE_DIALOG_CLOSED_BY_USER:
                                // In case of logout, closing by user is fine, so treat it as a resolve instead of a reject
                                resolve();
                                return;
                            default:
                                reject(new Error(event.message));
                                return;
                        }
                    });

                    // Note: not hooking up message listener because in the case of logout,
                    // not expecting to be messaged back (end up on logout page, not back on the app's turf).
                }
            );
        });
    }

    // This function is also duplicated in "about.ts" for logout of the default graph snippet registration.
    function _generateAuthUrl(params: {
        auth_action: 'login' | 'logout';
        resource: string;
        client_id: string;
        is_office_host: boolean;
    }): string {
        const queryParams = [
            `auth_action=${params.auth_action}`,
            `client_id=${encodeURIComponent(params.client_id)}`,
            `resource=${params.resource}`,
            `is_office_host=${params.is_office_host}`,
            `snippet_id=${_initializationParams.snippet.id}`,
        ].join('&');

        return window.location.origin + '/snippet/auth?' + queryParams;
    }

    function _isPlainWeb() {
        return !_isInsideOffice();
    }

    function _isInsideOffice() {
        return window &&
            (window as any).Office &&
            (window as any).Office.context;
    }

    function _isDialogApiSupported() {
        return (window as any).Office.context.requirements.isSetSupported('DialogApi');
    }

    function _extractAndCacheAccessToken(message: any, clientId: string, resource: string): string {
        cachedAuthTokens[_cacheKey(clientId, resource)] = {
            token: message.accessToken,
            expiry: Date.now() + ((message.expiresIn - 60 * 5 /* five minute of safety margin */) * 1000)
        };
        return message.accessToken;
    }

    function _getCachedAccessToken(clientId: string, resource: string): string {
        const cachedAuthToken = cachedAuthTokens[_cacheKey(clientId, resource)];
        if (!cachedAuthToken) {
            return null;
        }
        if (cachedAuthToken.expiry > Date.now()) {
            /* Token is valid. Return it */
            return cachedAuthToken.token;
        }
        else {
            /* Token in cache has expired. Remove it from the cache */
            _removeCachedAccessToken(clientId, resource);
            return null;
        }
    }

    function _cacheKey(clientId: string, resource: string) {
        return `${clientId}_${resource}`;
    }

    function _removeCachedAccessToken(clientId: string, resource: string) {
        if (cachedAuthTokens[_cacheKey(clientId, resource)]) {
            delete cachedAuthTokens[_cacheKey(clientId, resource)];
        }
    }
}

module Experimental {
    /** [PREVIEW] Creates an Excel.Session object for working with a remote workbook */
    export function setupRemoteWorkbookSession(url: string, accessToken: string) {
        const headers = {
            'Authorization': 'Bearer ' + accessToken
        };

        if (url.substr(url.length - 1) === '/') {
            url = url.substr(0, url.length - 1);
        }
        url += '/workbook';

        return new Excel.Session(url, headers, true /* persisted session */);
    }
}
