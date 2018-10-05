/* To incorporate the changes made here, run:
    npm run build:custom-functions-boilerplate
*/

import {
  generateLogString,
  ConsoleLogTypes,
  stringifyPlusPlus,
} from '../client/app/helpers/standalone-log-helper';

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
const WRITE_DELAY = 300;

declare var OfficeExtensionBatch: {
  CoreUtility: {
    _logEnabled: boolean;
  };
};

(async () => {
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
})();
