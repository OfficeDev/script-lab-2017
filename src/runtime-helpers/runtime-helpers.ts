/* tslint:disable:no-namespace */

// NOTE: At initialization, the ScriptLab namespace also expects
//       to be passed in a "._editorUrl" and "._strings" object
//       It is not listed on the namespace, however, to avoid polluting generated d.ts


/** A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    /** Gets an access token on behalf of the user for a particular service
     * @param service: The service provider (default: 'graph' = Microsoft Graph)
    */
    export function getAccessToken(clientId: string, service?: 'graph'): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!service) {
                service = 'graph';
            }

            let authDialog = window.open(
                _generateAuthUrl('login', clientId, service)
            );
            window.addEventListener('message', accessTokenMessageListener);

            // FIXME: probably only for browser?
            const dialogCloseWatcher = setInterval(() => {
                if (!authDialog || authDialog.closed) {
                    clearInterval(dialogCloseWatcher);
                    reject((ScriptLab as any)._strings.authenticationWasCancelledByTheUser);
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
                    reject(event.data.substr('AUTH:error='.length));
                    authDialog.close();
                    return;
                }
            }
        });
    }

    /** Log the user out of a service
     * @param service: The service provider (default: 'graph' = Microsoft Graph)
    */
    export function logout(clientId: string, service?: 'graph'): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!service) {
                service = 'graph';
            }

            let authDialog = window.open(
                _generateAuthUrl('logout', clientId, service)
            );

            // FIXME: probably only for browser?
            const dialogCloseWatcher = setInterval(() => {
                if (!authDialog || authDialog.closed) {
                    clearInterval(dialogCloseWatcher);
                    resolve();
                }
            }, 1000);
        });
    }

    function _generateAuthUrl(action: 'login' | 'logout', clientId: string, service: string): string {
        return (ScriptLab as any)._editorUrl +
            `/auth?action=${action}&client_id=${encodeURIComponent(clientId)}&service=${service}`;
    }
}