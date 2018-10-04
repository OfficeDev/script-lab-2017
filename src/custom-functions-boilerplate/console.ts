/* To incorporate the changes made here, do the following:
  1. npm run build:custom-functions-boilerplate
  2. open .\dist\console.g.js
  3. pipe it through a tool like http://pressbin.com/tools/urlencode_urldecode/,
        doing a "encodeURIComponent"
  4. paste it into .\src\server\custom-functions\base64preamble.ts
*/

import {
  generateLogString,
  ConsoleLogTypes,
  stringifyPlusPlus,
} from '../client/app/helpers/standalone-log-helper';

const StorageKey = 'playground_log'; // from "env.config.js";

type LogEntry = { severity: ConsoleLogTypes; message: string };

declare var OfficeExtensionBatch: {
  CoreUtility: {
    _logEnabled: boolean;
  };
};

(() => {
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

  let storageOperationInProgress = false;
  let queueToWrite: LogEntry[] = [];
  function queueToAppendToStorage(data: LogEntry) {
    if (storageOperationInProgress) {
      queueToWrite.push(data);
      return;
    }

    processQueue();
  }

  async function processQueue() {
    storageOperationInProgress = true;
    const currentValue = await OfficeRuntime.AsyncStorage.getItem(StorageKey);
    const newValue =
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

    await OfficeRuntime.AsyncStorage.setItem(StorageKey, newValue);

    // Wait just one more moment, so that has a chance to *really* batch up
    await new Promise(resolve => setTimeout(resolve, 100));

    if (queueToWrite.length > 0) {
      setTimeout(() => processQueue(), 0);
    } else {
      storageOperationInProgress = false;
    }
  }
})();
