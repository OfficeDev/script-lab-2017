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
    let data = {
      customFunctionsLastHeartbeatTimestamp: results[0][1],
      customFunctionsCurrentlyRunningTimestamp: results[1][1],
      log: results[2][1],
    };
    await OfficeRuntime.AsyncStorage.removeItem(localStorageKeys.log);
    return data;
  } else {
    ensureFreshLocalStorage();
    let data = {
      customFunctionsLastHeartbeatTimestamp: window.localStorage.getItem(
        localStorageKeys.customFunctionsLastHeartbeatTimestamp
      ),
      customFunctionsCurrentlyRunningTimestamp: window.localStorage.getItem(
        localStorageKeys.customFunctionsCurrentlyRunningTimestamp
      ),
      log: window.localStorage.getItem(localStorageKeys.log),
    };
    window.localStorage.removeItem(localStorageKeys.log);
    return data;
  }
}

function isUsingAsyncStorage(engineStatus: CustomFunctionEngineStatus): boolean {
  return (
    engineStatus.nativeRuntime &&
    Office.context.requirements.isSetSupported('CustomFunctions', 1.4)
  );
}
