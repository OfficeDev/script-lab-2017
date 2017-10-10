import { toNumber } from 'lodash';
import { environment, Messenger, CustomFunctionsMessageType, getCompileCustomFunctionsPayload } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

const POLLING_INTERVAL = 1000;

(() => {
    let messenger: Messenger<CustomFunctionsMessageType>;
    (async () => {
        const params: ICustomFunctionsHeartbeatParams =
            Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        // Can do partial initialization, since host is guaranteed to be known
        environment.initializePartial({ host: 'EXCEL' });

        messenger = new Messenger(environment.current.config.runnerUrl);

        messenger.send(window.parent, CustomFunctionsMessageType.SEND_DEBUG_MESSAGE, 'Custom Functions heartbeat started');

        const clientTimestamp = params.clientTimestamp;

        if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
            sendRefreshRequest();
            return;
        }

        window.localStorage.setItem(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
            params.clientTimestamp.toString());

        const interval = setInterval(() => {
            // "I'm still alive"
            const now = new Date();
            window.localStorage.setItem(
                localStorageKeys.customFunctionsLastHeartbeatTimestamp,
                now.getTime().toString());
            console.log(now.toString());

            // And check whether I should reload...
            if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
                clearInterval(interval);
                sendRefreshRequest();
            }

        }, POLLING_INTERVAL);

    })();

    function getLocalStorageLastUpdateTimestamp(): number {
        return toNumber(window.localStorage.getItem(localStorageKeys.customFunctionsLastUpdatedCodeTimestamp) || '0');
    }

    function sendRefreshRequest() {
        let payload = getCompileCustomFunctionsPayload('run');
        messenger.send(window.parent, CustomFunctionsMessageType.NEED_TO_REFRESH, payload);
    }

})();
