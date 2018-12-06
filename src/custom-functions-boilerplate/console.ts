/* To incorporate the changes made here, run:
    npm run build:custom-functions-boilerplate
*/

import {
  generateLogString,
  ConsoleLogTypes,
  stringifyPlusPlus,
} from '../client/app/helpers/standalone-log-helper';

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
  return function () {
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
  return function () {
    const errorText = `${funcName} could not be registered due to an error while loading the snippet: ${error}`;
    console.error(errorText);
    throw new Error(errorText);
  };
};

///////////////////////////////////////
/////////////// Helpers ///////////////
///////////////////////////////////////

type LogEntry = { severity: ConsoleLogTypes; message: string };

let logCounter = 0;
const StorageKeys = {
  logHash: 'cf_logs#',
};

async function setUpConsoleMonkeypatch() {
  try {
    let oldKeysToRemove = (await OfficeRuntime.AsyncStorage.getAllKeys())
      .filter(key => key.startsWith(StorageKeys.logHash));
    await OfficeRuntime.AsyncStorage.multiRemove(oldKeysToRemove);
  } catch (e) {
    console.error('Error clearing out initial AsyncStorage');
    console.error(e);
  }

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
      writeToAsyncStorage(generateLogString(args, methodName));
    };
  });
}

// Helper
async function writeToAsyncStorage(entry: LogEntry) {
  try {
    await OfficeRuntime.AsyncStorage.setItem(StorageKeys.logHash + (logCounter++), JSON.stringify({
      severity: entry.severity,
      message: stringifyPlusPlus(entry.message),
    }));
  } catch (e) {
    console.error('Error writing to AsyncStorage');
    console.error(e);
  }
}
