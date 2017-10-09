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

        const clientTimestamp = params.clientTimestamp;
        messenger = new Messenger(environment.current.config.runnerUrl);

        if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
            sendRefreshRequest();
            return;
        }

        window.localStorage.setItem(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
            params.clientTimestamp.toString());

        setInterval(() => {
            // "I'm still alive"
            window.localStorage.setItem(
                localStorageKeys.customFunctionsLastHeartbeatTimestamp,
                new Date().getTime().toString());

            // And check whether I should reload...
            if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
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
