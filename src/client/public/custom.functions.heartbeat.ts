import { toNumber } from 'lodash';
import { environment, Messenger, CustomFunctionsMessageType, getRunnerCustomFunctionsPayload,
    pushToLogQueue, ensureFreshLocalStorage } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

const POLLING_INTERVAL = 1000;

let messenger: Messenger<CustomFunctionsMessageType>;
let showDebugLog: boolean;

(() => {
    const params: ICustomFunctionsHeartbeatParams =
        Authenticator.extractParams(window.location.href.split('?')[1]) as any;

    showDebugLog = params.showDebugLog;

    // Can do partial initialization, since host is guaranteed to be known
    environment.initializePartial({ host: 'EXCEL' });

    setupMessenger(params.clientTimestamp);

    messenger.send(window.parent, CustomFunctionsMessageType.HEARTBEAT_READY, null);
})();

function setupMessenger(clientTimestamp: number) {
    messenger = new Messenger(environment.current.config.runnerUrl);

    messenger.listen<{ timestamp: number }>()
        .filter(({ type }) => type === CustomFunctionsMessageType.LOADED_AND_RUNNING)
        .subscribe(input => tryCatch(() => {
            // TODO CUSTOM FUNCTIONS STRINGS

            const message = 'Custom functions are reloaded';

            logToConsole({
                source: 'system',
                type: 'custom functions',
                subtype: 'runner',
                message,
                severity: 'info',
                ...input.message
            });

            const interval = setInterval(() => {
                tryCatch(() => {
                    const now = new Date();
                    window.localStorage.setItem(
                        localStorageKeys.customFunctionsLastHeartbeatTimestamp,
                        now.getTime().toString());

                    // Just for debugging:
                    // logToConsole({
                    //     timestamp: new Date().getTime(),
                    //     source: 'system',
                    //     type: 'custom functions',
                    //     subtype: 'heartbeat',
                    //     message: 'Tick, client timestamp ' + clientTimestamp,
                    //     severity: 'info',
                    // });



                    // And check whether I should reload...
                    if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
                        clearInterval(interval);
                        sendRefreshRequest();
                    }
                });
            }, POLLING_INTERVAL);

            window.localStorage.setItem(
                localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
                clientTimestamp.toString());
        }));

    messenger.listen<LogData>()
        .filter(({ type }) => type === CustomFunctionsMessageType.LOG)
        .subscribe(input => tryCatch(() => logToConsole(input.message)));

}

function getLocalStorageLastUpdateTimestamp(): number {
    ensureFreshLocalStorage();
    return toNumber(window.localStorage.getItem(localStorageKeys.customFunctionsLastUpdatedCodeTimestamp) || '0');
}

function sendRefreshRequest() {
    let payload = getRunnerCustomFunctionsPayload();
    messenger.send(window.parent, CustomFunctionsMessageType.NEED_TO_REFRESH, payload);
}

function logToConsole(data: LogData) {
    if (!showDebugLog) {
        return;
    }

    pushToLogQueue(data);

    messenger.send(window.parent, CustomFunctionsMessageType.SHOW_LOG_DIALOG, null);
}

function tryCatch(action: () => void) {
    try {
        action();
    }
    catch (e) {
        logToConsole({
            timestamp: new Date().getTime(),
            source: 'system',
            type: 'custom functions',
            subtype: 'heartbeat',
            message: e,
            severity: 'error',
        });
    }
}
