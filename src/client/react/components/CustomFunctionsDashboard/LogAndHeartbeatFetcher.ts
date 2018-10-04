import {
  getElapsedTime,
  CustomFunctionEngineStatus,
  ensureFreshLocalStorage,
} from '../../../app/helpers';
import { toNumber } from 'lodash';

const { localStorageKeys } = PLAYGROUND;

export async function getLogAndHeartbeatStatus(
  engineStatus: CustomFunctionEngineStatus
): Promise<{
  runnerIsAlive: boolean;
  newLogs: LogData[];
  runnerLastUpdated: number;
}> {
  let data = await bulkGetData(isUsingAsyncStorage(engineStatus));

  const runnerIsAlive =
    getElapsedTime(
      toNumber(
        window.localStorage.getItem(data.customFunctionsLastHeartbeatTimestamp) || '0'
      )
    ) < 3000;

  const runnerLastUpdated = toNumber(data.customFunctionsCurrentlyRunningTimestamp);

  const newLogs = processLog(data.log || '');
  return { runnerIsAlive, newLogs, runnerLastUpdated };
}

export async function clearLogStorage(engineStatus: CustomFunctionEngineStatus) {
  window.localStorage.removeItem(localStorageKeys.log);

  if (isUsingAsyncStorage(engineStatus)) {
    await OfficeRuntime.AsyncStorage.removeItem(localStorageKeys.log);
  }
}

// Helpers

function processLog(logsString: string) {
  if (logsString.length === 0) {
    return [];
  }

  window.localStorage.removeItem(localStorageKeys.log);

  const newLogs = logsString
    .split('\n')
    .filter(line => line !== '')
    .filter(line => !line.includes('Agave.HostCall'))
    .map(entry => JSON.parse(entry) as LogData);
  return newLogs;
}

async function bulkGetData(isUsingLocalStorage: boolean) {
  if (isUsingAsyncStorage) {
    const results = await OfficeRuntime.AsyncStorage.multiGet([
      localStorageKeys.customFunctionsLastHeartbeatTimestamp,
      localStorageKeys.customFunctionsCurrentlyRunningTimestamp,
      localStorageKeys.log,
    ]);
    return {
      customFunctionsLastHeartbeatTimestamp: results[0][0],
      customFunctionsCurrentlyRunningTimestamp: results[1][0],
      log: results[2][0],
    };
  } else {
    ensureFreshLocalStorage();
    return {
      customFunctionsLastHeartbeatTimestamp: window.localStorage.getItem(
        localStorageKeys.customFunctionsLastHeartbeatTimestamp
      ),
      customFunctionsCurrentlyRunningTimestamp: window.localStorage.getItem(
        localStorageKeys.customFunctionsCurrentlyRunningTimestamp
      ),
      log: window.localStorage.getItem(localStorageKeys.log),
    };
  }
}

function isUsingAsyncStorage(engineStatus: CustomFunctionEngineStatus): boolean {
  return (
    engineStatus.nativeRuntime &&
    Office.context.requirements.isSetSupported('CustomFunctions', 1.4)
  );
}
