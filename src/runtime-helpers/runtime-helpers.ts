class ScriptLab {
    static _editorUrl: string;

    /** Gets an access token on behalf of the user for a particular service
     * @param service: The service provider (default: 'graph' = Microsoft Graph)
    */
    static getAccessToken(clientId: string, service?: 'graph'): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!service) {
                service = 'graph';
            }

            window.open(ScriptLab._editorUrl + `/auth?client_id=${encodeURIComponent(clientId)}&service=${service}`);
            window.addEventListener('message', accessTokenMessageListener);

            function accessTokenMessageListener(event: MessageEvent) {
                if (event.origin !== ScriptLab._editorUrl) {
                    return;
                }
                if (typeof event.data !== 'string') {
                    return;
                }

                if (event.data.indexOf('AUTH:access_token=') === 0) {
                    window.removeEventListener('message', accessTokenMessageListener);
                    resolve(event.data.substr('AUTH:access_token='.length));
                    return;
                }
                if (event.data.indexOf('AUTH:error=') === 0) {
                    window.removeEventListener('message', accessTokenMessageListener);
                    reject(event.data.substr('AUTH:error='.length));
                    return;
                }
            }
        });
    }
}
