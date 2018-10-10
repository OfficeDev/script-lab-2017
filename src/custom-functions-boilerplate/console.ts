/* To incorporate the changes made here, run:
    npm run build:custom-functions-boilerplate
*/

import {
  generateLogString,
  ConsoleLogTypes,
  stringifyPlusPlus,
} from '../client/app/helpers/standalone-log-helper';

const WRITE_DELAY = 300;

declare var OfficeExtensionBatch: {
  CoreUtility: {
    _logEnabled: boolean;
  };
};

///////////////////////////////////////
///////////////////////////////////////

setUpConsoleMonkeypatch();

// And expose a couple of global helpers:
(global as any).__generateFunctionBinding__ = (
  funcName: string,
  func: Function
): Function => {
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    const args = arguments;
    try {
      const result = func.apply(global, args);
      if (typeof result === 'object' && result['then']) {
        return (result as Promise<any>).then(value => value).catch(e => {
          handleError(e);
          throw e;
        });
      } else {
        return result;
      }
    } catch (e) {
      handleError(e);
      throw e;
    }

    function handleError(e: Error) {
      console.error(funcName + ' threw an error: ' + e);
    }
  };
};

(global as any).__generateErrorFunction__ = (
  funcName: string,
  error: Error
): Function => {
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    const errorText = `${funcName} could not be registered due to an error while loading the snippet: ${error}`;
    console.error(errorText);
    throw new Error(errorText);
  };
};

///////////////////////////////////////
/////////////// Helpers ///////////////
///////////////////////////////////////

async function setUpConsoleMonkeypatch() {
  // from "env.config.js"
  const StorageKeys = {
    log: 'playground_log',
    customFunctionsLastHeartbeatTimestamp:
      'playground_custom_functions_last_heartbeat_timestamp',
    customFunctionsCurrentlyRunningTimestamp:
      'playground_custom_functions_currently_running_timestamp',
  };

  type LogEntry = { severity: ConsoleLogTypes; message: string };

  const startTime = new Date().getTime().toString();

  // Disable the verbose logging that's on by default in the native execution
  OfficeExtensionBatch.CoreUtility._logEnabled = false;

  const oldConsole = console;
  const logTypes: ConsoleLogTypes[] = ['log', 'info', 'warn', 'error'];
  console = {
    ...oldConsole,
  };

  logTypes.forEach(methodName => {
    console[methodName] = (...args: any[]) => {
      oldConsole[methodName](...args);
      queueToAppendToStorage(generateLogString(args, methodName));
    };
  });

  try {
    await OfficeRuntime.AsyncStorage.removeItem(StorageKeys.log);
  } catch (e) {
    console.error('Error clearing out initial AsyncStorage');
    console.error(e);
  }

  let queueToWrite: LogEntry[] = [];
  startWritingLoop();

  // Helpers
  function startWritingLoop() {
    writeToAsyncStorage();

    async function writeToAsyncStorage() {
      const currentValue = await OfficeRuntime.AsyncStorage.getItem(StorageKeys.log);
      const newLogValue =
        (currentValue ? currentValue + '\n' : '') +
        queueToWrite
          .map(entry =>
            JSON.stringify({
              severity: entry.severity,
              message: stringifyPlusPlus(entry.message),
            })
          )
          .join('\n');
      queueToWrite = [];
      await OfficeRuntime.AsyncStorage.multiSet([
        [StorageKeys.log, newLogValue],
        [StorageKeys.customFunctionsCurrentlyRunningTimestamp, startTime],
        [
          StorageKeys.customFunctionsLastHeartbeatTimestamp,
          new Date().getTime().toString(),
        ],
      ]);
      try {
      } catch (e) {
        console.error('Error writing to AsyncStorage');
        console.error(e);
      }

      setTimeout(writeToAsyncStorage, WRITE_DELAY);
    }
  }

  function queueToAppendToStorage(data: LogEntry) {
    queueToWrite.push(data);
  }
}
