import { CustomFunctionEngineStatus } from '../../../../app/helpers/utilities';

const { localStorageKeys } = PLAYGROUND;

export function initialize
export async function clearLogStorage(engineStatus: CustomFunctionEngineStatus) {
  window.localStorage.removeItem(localStorageKeys.log);

  if (isUsingAsyncStorage()) {
    await OfficeRuntime.AsyncStorage.clear();
  }
}

export async function getLogs(engineStatus: CustomFunctionEngineStatus) {
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

function isUsingAsyncStorage(): boolean {
  return (
    engineStatus.nativeRuntime &&
    Office.context.requirements.isSetSupported('CustomFunctions', 1.4)
  );
}
