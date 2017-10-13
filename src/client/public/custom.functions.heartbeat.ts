import { toNumber } from 'lodash';
import { environment, Messenger, CustomFunctionsMessageType, getCompileCustomFunctionsPayload, pushToLogQueue } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

const POLLING_INTERVAL = 1000;

let messenger: Messenger<CustomFunctionsMessageType>;
let showDebugLog: boolean;

(() => {
    const params: ICustomFunctionsHeartbeatParams =
        Authenticator.extractParams(window.location.href.split('?')[1]) as any;

    // Can do partial initialization, since host is guaranteed to be known
    environment.initializePartial({ host: 'EXCEL' });

    setupMessenger(params.clientTimestamp);

    const interval = setInterval(() => {
        tryCatch(() => {
            const now = new Date();
            window.localStorage.setItem(
                localStorageKeys.customFunctionsLastHeartbeatTimestamp,
                now.getTime().toString());

            logToConsole({
                timestamp: new Date().getTime(),
                source: 'system',
                type: 'custom functions',
                subtype: 'heartbeat',
                message: 'Tick',
                severity: 'info',
            });

            // And check whether I should reload...
            if (getLocalStorageLastUpdateTimestamp() > params.clientTimestamp) {
                clearInterval(interval);
                sendRefreshRequest();
            }
        });
    }, POLLING_INTERVAL);

})();

function setupMessenger(clientTimestamp: number) {
    messenger = new Messenger(environment.current.config.runnerUrl);

    messenger.listen<{timestamp: number}>()
        .filter(({ type }) => type === CustomFunctionsMessageType.LOADED_AND_RUNNING)
        .subscribe(input => tryCatch(() => {
            logToConsole({
                source: 'system',
                type: 'custom functions',
                subtype: 'runner',
                message: 'Loaded & running',
                severity: 'info',
                ...input.message
            });

            window.localStorage.setItem(
                localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
                clientTimestamp.toString());
        }));

    messenger.listen<LogData>()
        .filter(({ type }) => type === CustomFunctionsMessageType.LOG)
        .subscribe(input => tryCatch(() => logToConsole(input.message)));

}

function getLocalStorageLastUpdateTimestamp(): number {
    return toNumber(window.localStorage.getItem(localStorageKeys.customFunctionsLastUpdatedCodeTimestamp) || '0');
}

function sendRefreshRequest() {
    let payload = getCompileCustomFunctionsPayload('run');
    messenger.send(window.parent, CustomFunctionsMessageType.NEED_TO_REFRESH, payload);
}

function logToConsole(data: LogData) {
    if (!showDebugLog) {
        return;
    }

    pushToLogQueue(data);

    // Try to launch dialog (will no-op if already opened)
    Office.context.ui.displayDialogAsync(`${environment.current.config.editorUrl}/log.html`);
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
