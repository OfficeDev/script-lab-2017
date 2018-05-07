import * as $ from 'jquery';
import {
  environment,
  generateUrl,
  navigateToRunCustomFunctions,
  stringifyPlusPlus,
  assertIdentical,
} from '../app/helpers';
import { Messenger, CustomFunctionsMessageType } from '../app/helpers/messenger';

interface InitializationParams {
  snippetsDataBase64: string;
  metadataBase64: string;
  heartbeatParams: ICustomFunctionsHeartbeatParams;
}

let heartbeat: {
  messenger: Messenger<CustomFunctionsMessageType>;
  window: Window;
};

interface RunnerCustomFunctionMetadata extends ICustomFunctionsSnippetRegistrationData {
  id: string;
}

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;"
tryCatch(async () => {
  let params: InitializationParams = (window as any).customFunctionParams;

  try {
    environment.initializePartial({ host: 'EXCEL' });

    await establishHeartbeat(params.heartbeatParams);

    logIfExtraLoggingEnabled('Custom functions runner is loading, please wait...');

    await initializeRunnableSnippets(params);

    await environment.createPlaygroundHostReadyTimer();

    await window['Excel']['CustomFunctions']['initialize']();

    logIfExtraLoggingEnabled(
      'Custom functions runner is ready to evaluate your functions!'
    );
  } catch (error) {
    handleError(error);
  }
});

// From here on out, helper functions:

async function initializeRunnableSnippets(params: InitializationParams) {
  return new Promise((resolve, reject) =>
    tryCatch(() => {
      let successfulRegistrationsCount = 0;

      const metadataArray: RunnerCustomFunctionMetadata[] = JSON.parse(
        atob(params.metadataBase64)
      );

      (window as any).scriptRunnerBeginInit = (
        contentWindow: Window,
        options: {
          /* don't need them */
        }
      ) =>
        tryCatch(() => {
          (contentWindow as any).console = window.console;
          contentWindow.onerror = (...args) => console.error(args);

          // Expose "OfficeExtension" and "Office" to the iframe, since those
          // might be used (e.g., for Promises).  But don't expose any further APIs
          ['Office', 'OfficeExtension'].forEach(namespace => {
            contentWindow[namespace] = window[namespace];
          });
        });

      (window as any).scriptRunnerEndInit = (iframeWindow: Window, id: string) =>
        tryCatch(() => {
          const snippetMetadata = metadataArray.find(item => item.id === id);
          const uppercaseNamespace = snippetMetadata.namespace.toUpperCase();

          logIfExtraLoggingEnabled(
            `Mapping custom functions from namespace ${
              snippetMetadata.namespace
            }, expecting ${snippetMetadata.functions.length} functions`
          );

          window[uppercaseNamespace] = {};
          snippetMetadata.functions.map(func => {
            // Expect functions to have one-and-only-one dot, separating
            // the namespace from the function name.
            let splitIndex = assertIdentical(
              func.name.indexOf('.'),
              func.name.lastIndexOf('.')
            );
            // this should never happen:
            if (splitIndex <= 0) {
              throw new Error(`Invalid namespace.funcname format ("${func.name}")`);
            }
            let funcName = func.name.substr(splitIndex + 1);
            let funcNameUppercase = funcName.toUpperCase();

            logIfExtraLoggingEnabled(funcName, {
              indent: 4,
            });

            // disable the rule because want to use "arguments",
            //    which isn't allowed in an arrow function
            // tslint:disable-next-line:only-arrow-functions
            window[uppercaseNamespace][funcNameUppercase] = function() {
              try {
                return iframeWindow[funcName /*regular, not uppercase*/].apply(
                  null,
                  arguments
                );
              } catch (e) {
                const error = new Error(`Unable to execute function "${func.name}"`);
                handleError(error);

                // Also throw the error to get this reflected into Excel's calc chain:
                throw error;
              }
            };

            // Overwrite console.log on every snippet iframe
            let logTypes: ConsoleLogTypes[] = ['log', 'info', 'warn', 'error'];
            logTypes.forEach(
              methodName =>
                (iframeWindow['console'][methodName] = consoleMsgTypeImplementation(
                  methodName
                ))
            );

            function consoleMsgTypeImplementation(severityType: ConsoleLogTypes) {
              return (...args) => {
                let logMsg: string = '';
                let isSuccessfulMsg: boolean = true;
                args.forEach((element, index, array) => {
                  try {
                    logMsg += stringifyPlusPlus(element);
                  } catch (e) {
                    isSuccessfulMsg = false;
                    logMsg += '<Unable to log>';
                  }
                  logMsg += '\n';
                });
                if (logMsg.length > 0) {
                  logMsg = logMsg.trim();
                }
                tryToSendLog({
                  source: funcName,
                  severity: isSuccessfulMsg ? severityType : 'error',
                  message: logMsg,
                });
              };
            }
          });

          successfulRegistrationsCount++;

          if (successfulRegistrationsCount === metadataArray.length) {
            resolve();
          }
        });

      const snippetsHtmls: string[] = JSON.parse(atob(params.snippetsDataBase64));

      snippetsHtmls.forEach(html => {
        let $iframe = $(
          '<iframe class="snippet-frame" src="about:blank"></iframe>'
        ).appendTo('body');
        let iframe = $iframe[0] as HTMLIFrameElement;
        let { contentWindow } = iframe;

        // Write to the iframe (and note that must do the ".write" call first,
        // before setting any window properties). Setting console and onerror here
        // (for any initial logging or error handling from snippet-referenced libraries),
        // but for extra safety also setting them inside of scriptRunnerInitialized.
        contentWindow.document.open();
        contentWindow.document.write(html);
        (contentWindow as any).console = window.console;
        contentWindow.onerror = (...args) => {
          handleError({ error: args });
        };
        contentWindow.document.close();
      });
    })
  );
}

function establishHeartbeat(
  heartbeatParams: ICustomFunctionsHeartbeatParams
): Promise<any> {
  const $iframe = $('<iframe>', {
    src: generateUrl(
      `${environment.current.config.editorUrl}/custom-functions-heartbeat.html`,
      heartbeatParams
    ),
    id: 'heartbeat',
  })
    .css('display', 'none')
    .appendTo('body');

  heartbeat = {
    messenger: new Messenger(environment.current.config.editorUrl),
    window: ($iframe[0] as HTMLIFrameElement).contentWindow,
  };

  heartbeat.messenger
    .listen<{}>()
    .filter(({ type }) => type === CustomFunctionsMessageType.NEED_TO_REFRESH)
    .subscribe(async input => {
      navigateToRunCustomFunctions(input.message);
    });

  return new Promise(resolve => {
    heartbeat.messenger
      .listen<string>()
      .filter(({ type }) => type === CustomFunctionsMessageType.HEARTBEAT_READY)
      .subscribe(resolve);
  });
}

function tryToSendLog(data: LogData) {
  try {
    heartbeat.messenger.send<LogData>(
      heartbeat.window,
      CustomFunctionsMessageType.LOG,
      data
    );
  } catch (e) {
    // If couldn't log, not much you can do about it.  Write to console.log just in case,
    // but that's not going to help much on an invisible runner...
    console.log(e);
  }
}

async function tryCatch(func: () => any) {
  try {
    await func();
  } catch (e) {
    handleError(e);
  }
}

function handleError(error: Error | any) {
  tryToSendLog({
    message: stringifyPlusPlus(error),
    severity: 'error',
    source: '[SYSTEM]',
  });
}
function logIfExtraLoggingEnabled(message: string, options?: { indent?: number }) {
  if (environment.current.experimentationFlags.customFunctions.extraLogging) {
    options = options || {};
    options.indent = options.indent || 0;

    tryToSendLog({
      message: message,
      severity: 'info',
      source: '[SYSTEM]',
      indent: options.indent,
    });
  }
}
