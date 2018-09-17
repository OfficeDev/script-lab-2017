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
