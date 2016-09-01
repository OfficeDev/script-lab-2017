import {EndpointManager, IEndpoint} from './managers/endpoint.manager';
import {TokenManager, IToken} from './managers/token.manager';

declare var Microsoft: any;

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
    }

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
    authenticate(provider: string, force: boolean = false): Promise<IToken> {
        let token = this._tokenManager.get(provider);
        if (token != null && !force) return Promise.resolve(token);

        let endpoint = this._endpointManager.get(provider);

        var auth;
        if (Authenticator.isAddin) auth = this._openInDialog(endpoint);
        else auth = this._openInWindowPopup(endpoint);

        return auth.catch(error => console.error(error));
    }

    /**
     * Check if the supplied url has either access_token or code or error 
     */
    static isTokenUrl(url: string) {
        var regex = /(access_token|code|error)/gi;
        return regex.test(url);
    }

    /**
     * Check if the code is running inside of an Addin or Web Context.
     * The checks for Office and Word, Excel or OneNote objects.
     */
    private static _isAddin: boolean;
    static get isAddin() {
        if (_.isUndefined(Authenticator._isAddin)) {
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

        return new Promise<IToken>((resolve, reject) => {
            try {
                let interval = setInterval(() => {
                    try {
                        if (popupWindow.document.URL.indexOf(endpoint.redirectUrl) !== -1) {
                            clearInterval(interval);
                            let token = TokenManager.getToken(popupWindow.document.URL, endpoint.redirectUrl);
                            this._tokenManager.add(endpoint.provider, token);
                            popupWindow.close();
                            resolve(token);
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
            height: 35,
            width: 35,
            requireHTTPS: true
        };

        return new Promise<IToken>((resolve, reject) => {
            Office.context.ui.displayDialogAsync(url, options, result => {
                var dialog = result.value;
                dialog.addEventHandler(Microsoft.Office.WebExtension.EventType.DialogMessageReceived, args => {
                    dialog.close();
                    try {
                        if (args.message == '' || args.message == null) {
                            reject("No token received");
                        }

                        if (args.message.indexOf('access_token') == -1) {
                            reject(JSON.parse(args.message));
                        }

                        let token = JSON.parse(args.message);
                        this._tokenManager.add(endpoint.provider, token);
                        resolve(token);
                    }
                    catch (exception) {
                        reject(exception);
                    }
                })
            });
        });
    }
}