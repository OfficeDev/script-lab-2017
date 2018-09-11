import {
  generateLogString,
  ConsoleLogTypes,
} from '../client/app/helpers/standalone-log-helper';

(() => {
  const oldConsole = console;
  const logTypes: ConsoleLogTypes[] = ['log', 'info', 'warn', 'error'];
  console = {
    ...oldConsole,
  };

  logTypes.forEach(methodName => {
    console[methodName] = (...args: any[]) => {
      oldConsole[methodName](...args);
      let generated = generateLogString(args, methodName);
      alert(generated.message);
    };
  });
})();
