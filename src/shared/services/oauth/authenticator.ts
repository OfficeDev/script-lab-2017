import {EndpointManager, IEndpoint} from './managers/endpoint.manager';
import {TokenManager, IToken, ICode, IError} from './managers/token.manager';

/**
 * Enumeration for the supported modes of Authentication.
 * Either dialog or redirection.
 */
export enum AuthenticationMode {
    /**
     * Opens a the authorize url inside of a dialog.
     */
    Dialog,

    /**
     * Redirects the current window to the authorize url.
     */
    Redirect
}

/**
 * Helper for performing Implicit OAuth Authentication with registered endpoints. 
 */
export class Authenticator {
    /**
     * @constructor
     * 
     * @param endpointManager Depends on an instance of EndpointManager
     * @param TokenManager Depends on an instance of TokenManager
    */
    constructor(
        private _endpointManager: EndpointManager,
        private _tokenManager: TokenManager
    ) {
        if (_endpointManager == null) throw 'Please pass an instance of EndpointManager.';
        if (_tokenManager == null) throw 'Please pass an instance of TokenManager.';
        if (_endpointManager.count == 0) throw 'No registered Endpoints could be found. Either use the default endpoint registrations or add one manually';
    }

    /**
     * Controls the way the authentication should take place.
     * Either by using dialog or by redirecting the current window.
     * Defaults to the dialog flow.
     */
    static mode: AuthenticationMode = AuthenticationMode.Dialog;

    /**
     * Authenticate based on the given provider
     * Either uses DialogAPI or Window Popups based on where its being called from
     * viz. Add-in or Web.
     * If the token was cached, the it retrieves the cached token.
     * 
     * WARNING: you have to manually check the expires_in or expires_at property to determine
     * if the token has expired. Not all OAuth providers support refresh token flows. 
     * 
     * @param {string} provider Link to the provider.
     * @param {boolean} force Force re-authentication.
     * @return {Promise<IToken>} Returns a promise of the token.
     */
    authenticate(provider: string, force: boolean = false): Promise<IToken | ICode | IError> {
        let token = this._tokenManager.get(provider);
        if (token != null && !force) return Promise.resolve(token);

        let endpoint = this._endpointManager.get(provider);

        if (Authenticator.mode == AuthenticationMode.Redirect) {
            let url = EndpointManager.getLoginUrl(endpoint);
            location.replace(url);
            return Promise.reject('AUTH_REDIRECT') as Promise<any>;
        }
        else {
            var auth;
            if (Authenticator.isAddin) auth = this._openInDialog(endpoint);
            else auth = this._openInWindowPopup(endpoint);
            return auth.catch(error => console.error(error));
        }
    }

    /**
     * Check if the currrent url is running inside of a Dialog that contains an access_token or code or error.
     * If true then it calls messageParent by extracting the token information.
     *
     * @return {boolean}
     * Returns false if the code is running inside of a dialog without the requried information
     * or is not running inside of a dialog at all.
     */
    static get isDialog(): boolean {
        if (!Authenticator.isAddin) return false;
        else {
            if (!TokenManager.isTokenUrl(location.href)) return false;

            var token = TokenManager.getToken(location.href, location.origin);
            Office.context.ui.messageParent(JSON.stringify(token));
            return true;
        }
    }

    /**
     * Check if the code is running inside of an Addin or Web Context.
     * The checks for Office and Word, Excel or OneNote objects.
     */
    private static _isAddin: boolean;
    static get isAddin() {
        if (Authenticator._isAddin == null) {
            Authenticator._isAddin =
                window.hasOwnProperty('Office') &&
                (
                    window.hasOwnProperty('Word') ||
                    window.hasOwnProperty('Excel') ||
                    window.hasOwnProperty('OneNote')
                );
        }

        return Authenticator._isAddin;
    }

    static set isAddin(value: boolean) {
        Authenticator._isAddin = value;
    }

    private _openInWindowPopup(endpoint: IEndpoint) {
        let url = EndpointManager.getLoginUrl(endpoint);
        let windowSize = endpoint.windowSize || "width=400,height=600";
        let windowFeatures = windowSize + ",menubar=no,toolbar=no,location=no,resizable=no,scrollbars=yes,status=no";
        let popupWindow: Window = window.open(url, endpoint.provider.toUpperCase(), windowFeatures);

        return new Promise<IToken | ICode | IError>((resolve, reject) => {
            try {
                let interval = setInterval(() => {
                    try {
                        if (popupWindow.document.URL.indexOf(endpoint.redirectUrl) !== -1) {
                            clearInterval(interval);
                            let result = TokenManager.getToken(popupWindow.document.URL, endpoint.redirectUrl);
                            if (result == null) reject('No access_token or code could be parsed.');
                            else if ('code' in result) {
                                popupWindow.close();
                                resolve(result as ICode);
                            }
                            else if ('access_token' in result) {
                                this._tokenManager.add(endpoint.provider, result as IToken);
                                popupWindow.close();
                                resolve(result as IToken);
                            }
                            else {
                                reject(result as IError);
                            }
                        }
                    }
                    catch (exception) {
                        if (!popupWindow) {
                            clearInterval(interval);
                            reject(exception);
                        }
                    }
                }, 400);
            }
            catch (exception) {
                popupWindow.close();
                reject(exception);
            }
        });
    }

    private _openInDialog(endpoint: IEndpoint) {
        let url = EndpointManager.getLoginUrl(endpoint);

        var options: Office.DialogOptions = {
            height: 75,
            width: 50
        };

        return new Promise<IToken | ICode | IError>((resolve, reject) => {
            Office.context.ui.displayDialogAsync(url, options, result => {
                var dialog = result.value;
                dialog.addEventHandler((<any>Office).EventType.DialogMessageReceived, args => {
                    dialog.close();
                    try {
                        if (args.message == null || args.message === '') reject('No access_token or code could be parsed.');

                        var json = JSON.parse(args.message);

                        if ('code' in json) {
                            resolve(json as ICode);
                        }
                        else if ('access_token' in json) {
                            this._tokenManager.add(endpoint.provider, json as IToken);
                            resolve(json as IToken);
                        }
                        else {
                            reject(json as IError);
                        }
                    }
                    catch (exception) {
                        reject(exception);
                    }
                })
            });
        });
    }
}