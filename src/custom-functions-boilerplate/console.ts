import {
  generateLogString,
  ConsoleLogTypes,
  stringifyPlusPlus,
} from '../client/app/helpers/standalone-log-helper';

const StorageKey = 'playground_log'; // from "env.config.js";

(() => {
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
  let queueToWrite = [];
  function queueToAppendToStorage(data: { severity: ConsoleLogTypes; message: string }) {
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
