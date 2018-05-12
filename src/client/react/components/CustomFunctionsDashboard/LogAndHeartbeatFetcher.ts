import { getElapsedTime, getNumberFromLocalStorage } from '../../../app/helpers';
const { localStorageKeys } = PLAYGROUND;

export function getLogAndHeartbeatStatus(): {
  runnerIsAlive: boolean;
  newLogs: LogData[];
  runnerLastUpdated: number;
} {
  const runnerIsAlive =
    getElapsedTime(
      getNumberFromLocalStorage(localStorageKeys.customFunctionsLastHeartbeatTimestamp)
    ) < 3000;

  const runnerLastUpdated = getNumberFromLocalStorage(
    localStorageKeys.customFunctionsCurrentlyRunningTimestamp
  );

  const newLogs = getLogs();
  return { runnerIsAlive, newLogs, runnerLastUpdated };
}

function getLogs() {
  const logsString = window.localStorage.getItem(localStorageKeys.log) || '';
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
