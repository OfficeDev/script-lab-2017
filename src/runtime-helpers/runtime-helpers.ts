/* tslint:disable:no-namespace */

// NOTE: At initialization, the ScriptLab namespace also expects
//       to be passed in a "._editorUrl" and "._strings" object
//       It is not listed on the namespace, however, to avoid polluting generated d.ts

// TODO: switch to the dialog functionality of OfficeJsHelpers (which has benefits
// like caching of access token, better testing / security review, etc.).  But, some gaps:
// - Need logout
// - String localizations


/** [PREVIEW/ALPHA] A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    const CODE_DIALOG_CLOSED_BY_USER = 12006;

    /** [PREVIEW/ALPHA] Gets an access token on behalf of the user for a particular service
     * @param service: The service provider (default: 'graph' = Microsoft Graph)
    */
    export function getAccessToken(clientId: string, service: 'graph' = 'graph'): Promise<string> {
        if (_isPlainWeb()) {
            return _getAccessTokenViaWindowOpen(clientId, service);
        } else if (_isDialogApiSupported()) {
            return _getAccessTokenViaDialogApi(clientId, service);
        } else {
            throw new Error((ScriptLab as any)._strings.officeVersionDoesNotSupportAuthentication);
        }
    }

    /** [PREVIEW/ALPHA] Log the user out of a service
     * @param service: The service provider (default: 'graph' = Microsoft Graph)
    */
    export function logout(clientId: string, service: 'graph' = 'graph'): Promise<any> {
        if (_isPlainWeb()) {
            return _logoutViaWindowOpen(clientId, service);
        } else if (_isDialogApiSupported()) {
            return _logoutViaDialogApi(clientId, service);
        } else {
            throw new Error((ScriptLab as any)._strings.officeVersionDoesNotSupportAuthentication);
        }
    }

    function _getAccessTokenViaWindowOpen(clientId: string, service: string): Promise<string> {
        return new Promise((resolve, reject) => {

            let authDialog = window.open(
                _generateAuthUrl({ action: 'login', client_id: clientId, service: service as any, is_office_host: false }),
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
                if (event.origin !== (ScriptLab as any)._editorUrl) {
                    return;
                }
                if (typeof event.data !== 'string') {
                    return;
                }

                if (event.data.indexOf('AUTH:access_token=') === 0) {
                    window.removeEventListener('message', accessTokenMessageListener);
                    resolve(event.data.substr('AUTH:access_token='.length));
                    authDialog.close();
                    return;
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

    function _getAccessTokenViaDialogApi(clientId: string, service: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Office.context.ui.displayDialogAsync(
                _generateAuthUrl({ action: 'login', client_id: clientId, service: service as any, is_office_host: true }),
                { height: 50, width: 50 },
                result => {
                    if (result.status !== Office.AsyncResultStatus.Succeeded) {
                        reject(new Error(result.error.message));
                        return;
                    }

                    let dialog: Office.DialogHandler = result.value;
                    dialog.addEventHandler(Office.EventType.DialogEventReceived, result => {
                        switch (result.error.code) {
                            case CODE_DIALOG_CLOSED_BY_USER:
                                reject(new Error((ScriptLab as any)._strings.authenticationWasCancelledByTheUser));
                                return;
                            default:
                                reject(new Error(result.error.message));
                                return;
                        }
                    });

                    dialog.addEventHandler(Office.EventType.DialogMessageReceived, args => {
                        try {
                            if (typeof args.message !== 'string') {
                                throw new Error(); // to be caught below
                            }

                            if (args.message.indexOf('AUTH:access_token=') === 0) {
                                resolve(args.message.substr('AUTH:access_token='.length));
                                dialog.close();
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

    function _logoutViaWindowOpen(clientId: string, service: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let authDialog = window.open(
                _generateAuthUrl({ action: 'logout', client_id: clientId, service: service as any, is_office_host: false }),
                '_blank',
                'width=1024,height=768'
            );

            // Wait until the window is closed before resolving (and assume that closed = good enough,
            // i.e., that it probably did succeed in logging out)
            const dialogCloseWatcher = setInterval(() => {
                if (!authDialog || authDialog.closed) {
                    clearInterval(dialogCloseWatcher);
                    resolve(void 0);
                }
            }, 1000);

            // Note: not hooking up message listener because in the case of logout,
            // not expecting to be messaged back (end up on logout page, not back on the app's turf).
        });
    }

    function _logoutViaDialogApi(clientId: string, service: string): Promise<any> {
        return new Promise((resolve, reject) => {
            Office.context.ui.displayDialogAsync(
                _generateAuthUrl({ action: 'logout', client_id: clientId, service: service as any, is_office_host: true }),
                { height: 50, width: 50 },
                result => {
                    if (result.status !== Office.AsyncResultStatus.Succeeded) {
                        reject(new Error(result.error.message));
                        return;
                    }

                    let dialog: Office.DialogHandler = result.value;
                    dialog.addEventHandler(Office.EventType.DialogEventReceived, result => {
                        switch (result.error.code) {
                            case CODE_DIALOG_CLOSED_BY_USER:
                                // In case of logout, closing by user is fine, so treat it as a resolve instead of a reject
                                resolve(void 0);
                                return;
                            default:
                                reject(new Error(result.error.message));
                                return;
                        }
                    });

                    // Note: not hooking up message listener because in the case of logout,
                    // not expecting to be messaged back (end up on logout page, not back on the app's turf).
                }
            );
        });
    }

    function _generateAuthUrl(params: {
        action: 'login' | 'logout';
        service: 'graph';
        client_id: string;
        is_office_host: boolean;
    }): string {
        const queryParams = [
            `action=${params.action}`,
            `client_id=${encodeURIComponent(params.client_id)}`,
            `service=${params.service}`,
            `is_office_host=${params.is_office_host}`
        ].join('&');

        return (ScriptLab as any)._editorUrl + '/auth?' + queryParams;
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
}
