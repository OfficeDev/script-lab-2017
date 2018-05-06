import { toNumber } from 'lodash';
import {
  environment,
  Messenger,
  CustomFunctionsMessageType,
  getRunnerCustomFunctionsPayload,
  pushToLogQueue,
  ensureFreshLocalStorage,
} from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

const POLLING_INTERVAL = 1000;

let messenger: Messenger<CustomFunctionsMessageType>;

tryCatch(() => {
  const params: ICustomFunctionsHeartbeatParams = Authenticator.extractParams(
    window.location.href.split('?')[1]
  ) as any;

  // Can do partial initialization, since host is guaranteed to be known
  environment.initializePartial({ host: 'EXCEL' });

  setupMessenger();
  startPollingForChanges(params.clientTimestamp);

  messenger.send(
    window.parent,
    CustomFunctionsMessageType.HEARTBEAT_READY,
    null
  );
});

// Helpers from here on down

function setupMessenger() {
  messenger = new Messenger(environment.current.config.runnerUrl);

  messenger
    .listen<LogData>()
    .filter(({ type }) => type === CustomFunctionsMessageType.LOG)
    .subscribe(input => tryCatch(() => logToConsole(input.message)));
}

function startPollingForChanges(clientTimestamp: number) {
  const interval = setInterval(() => {
    tryCatch(() => {
      const now = new Date();
      window.localStorage.setItem(
        localStorageKeys.customFunctionsLastHeartbeatTimestamp,
        now.getTime().toString()
      );

      // And check whether I should reload...
      if (getLocalStorageLastUpdateTimestamp() > clientTimestamp) {
        clearInterval(interval);
        sendRefreshRequest();
      }
    });
  }, POLLING_INTERVAL);

  window.localStorage.setItem(
    localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
    clientTimestamp.toString()
  );
}

function getLocalStorageLastUpdateTimestamp(): number {
  ensureFreshLocalStorage();
  return toNumber(
    window.localStorage.getItem(
      localStorageKeys.customFunctionsLastUpdatedCodeTimestamp
    ) || '0'
  );
}

function sendRefreshRequest() {
  let payload = getRunnerCustomFunctionsPayload();
  messenger.send(
    window.parent,
    CustomFunctionsMessageType.NEED_TO_REFRESH,
    payload
  );
}

function logToConsole(data: LogData) {
  pushToLogQueue(data);

  if (messenger) {
    messenger.send(
      window.parent,
      CustomFunctionsMessageType.SHOW_LOG_DIALOG,
      null
    );
  }
}

async function tryCatch(action: () => void) {
  try {
    await action();
  } catch (e) {
    logToConsole({
      source: '[SYSTEM]',
      message: e,
      severity: 'error',
    });
  }
}
