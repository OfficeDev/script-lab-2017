// tslint:disable-next-line:no-reference
/// <reference path="./maker-interfaces.d.ts" />

/* tslint:disable:no-namespace */
self.importScripts('sync-office-js'); // import sync office js code

const VERBOSE_LOG = true;

function ifVerbose(callback: () => void) {
  if (VERBOSE_LOG) {
    callback();
  }
}

// TODO: move these.

const consoleMethods = ['log', 'info', 'error'];
type ConsoleMethodType = 'log' | 'info' | 'error';
type MakerWorkerMessageType = ConsoleMethodType | 'result' | 'perfInfo';

interface MakerWorkerMessage {
  type: MakerWorkerMessageType;
  content: any;
}

interface ExecuteMakerScriptMessage {
  accessToken: string;
  makerCode: string;
  activeDocumentUrl: string;
  scriptReferences: string[];
}

interface RequestUrlAndHeaderInfo {
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: { [name: string]: string };
}

// By setting "console", overwriting "self.console" which TS thinks is a read-only variable...
const oldConsole = console;
console = {
  ...oldConsole,
  log: item => processAndSendMessage('log', item),
  info: item => processAndSendMessage('info', item),
  error: item => processAndSendMessage('error', item),
};

function processAndSendMessage(type: MakerWorkerMessageType, content: any) {
  if (consoleMethods.indexOf(type) >= 0) {
    oldConsole[type](content);
  }

  postMessage({
    type,
    content: getHappilySerializeableContent(),
  });

  // Helper:
  function getHappilySerializeableContent() {
    if (typeof content === 'undefined') {
      return undefined;
    }
    if (typeof content === 'string') {
      return content;
    }

    try {
      return JSON.parse(JSON.stringify(content, replaceErrors));
    } catch (e) {
      // Just in case
      return content;
    }

    // Helper:
    function replaceErrors(key, value) {
      if (value instanceof Error) {
        const error = {};
        Object.getOwnPropertyNames(value).forEach(key => (error[key] = value[key]));
        return error;
      }

      return value;
    }
  }
}

namespace Experimental {
  export namespace ExcelMaker {
    export namespace _Internal {
      export interface MockExcelContext {
        originalSyncSynchronous(): void;
        syncSynchronous(): void;
        trackedObjects: {
          _retrieveAndClearAutoCleanupList(): OfficeExtension.ClientObject;
          remove(item: OfficeExtension.ClientObject): void;
        };
        workbook: Excel.Workbook;
      }

      export let _accessToken: string;
      export let _activeDocumentUrl: string;
      export const contexts: MockExcelContext[] = [];

      let sessions: { [documentUrl: string]: string } = {};

      export function getWorkbook(workbookUrl: string): Excel.Workbook {
        let context = getExcelContext(_accessToken, workbookUrl);
        contexts.push(context);
        return context.workbook;
      }

      export function runMakerFunction(makerCode: string) {
        let result: any;

        try {
          // tslint:disable-next-line:no-eval
          eval(`result = ${makerCode}();`);

          cleanUpContexts();
        } catch (e) {
          console.error(e);
          if (e instanceof OfficeExtension.Error) {
            const errorParts = ['Code: ' + e.code, e.message];
            if (e.debugInfo.errorLocation) {
              errorParts.push('Location: ' + e.debugInfo.errorLocation);
            }
            console.error(errorParts.join('\n'));
          }
        }
        // closeSessions();

        return result;
      }

      export function getExcelContext(
        accessToken: string,
        documentUrl: string
      ): MockExcelContext {
        let sessionId: string;

        if (sessions[documentUrl]) {
          ifVerbose(() =>
            console.log(`found session id in cache ${sessions[documentUrl]}`)
          );
          sessionId = sessions[documentUrl];
        } else {
          sessionId = createSession(accessToken, documentUrl);
        }

        let sessionInfo: RequestUrlAndHeaderInfo = {
          url: documentUrl,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'workbook-session-id': sessionId,
          },
        };

        let ctx: any = new Excel.RequestContext(sessionInfo as any);
        ctx._autoCleanup = true;

        try {
          ctx.workbook.load('$none');
          ctx.syncSynchronous();
        } catch (e) {
          ifVerbose(() => {
            console.error(e);
            console.info('clearing cache of sessions');
          });
          delete sessions[documentUrl]; // removing from cache in case it exists
          return getExcelContext(accessToken, documentUrl); // potential infinite loop if network goes down or something of that nature
        }

        return ctx;
      }

      export function cleanUpContexts() {
        contexts.forEach(context => context.syncSynchronous());

        contexts.forEach(ctx => {
          try {
            const itemsToRemove = ctx.trackedObjects._retrieveAndClearAutoCleanupList();
            // tslint:disable-next-line:forin
            for (const key in itemsToRemove) {
              ctx.trackedObjects.remove(itemsToRemove[key]);
            }

            ctx.syncSynchronous();
          } catch (e) {
            console.error('unexpected cleanup failed, continuing but sad ;(');
            console.error(e);
          }
        });
      }

      export function createSession(accessToken: string, documentUrl: string): string {
        // Busy-wait so that can do this synchronously...
        function sleepFor(sleepDuration) {
          const now = new Date().getTime();
          while (new Date().getTime() < now + sleepDuration) {
            /* do nothing */
          }
        }

        for (let i = 0; i < 10; i++) {
          ifVerbose(() =>
            console.info(`attempting to createSession for '${documentUrl}'`)
          );
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${documentUrl}/createSession`, false);

          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          xhr.setRequestHeader('content-type', 'application/json');

          xhr.send(null);

          if (xhr.readyState === 4 && xhr.status === 201) {
            let response = JSON.parse(xhr.responseText);
            ifVerbose(() => console.info(`obtained a session id: ${response.id}`));
            sessions[documentUrl] = response.id;
            return response.id;
          } else {
            console.error(
              'Request failed to create session.  Returned status of ' + xhr.status
            );
            sleepFor(2000);
            // return null;
          }
        }

        throw new Error(
          'Could not create a workbook session. Try again in a minute, or logout and try on another tenant?'
        );
      }

      export function closeSessions() {}

      export function closeSession(
        accessToken: string,
        documentUrl: string,
        sessionId: string
      ): null {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${documentUrl}/closeSession`, false);

        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.setRequestHeader('workbook-session-id', sessionId);

        xhr.send(null);

        if (!(xhr.readyState === 4 && xhr.status === 204)) {
          console.error(
            'Request failed to close session.  Returned status of ' + xhr.status
          );
        } else {
          console.info(`successfully closed session ${sessionId}`);
        }

        return null;
      }
    }

    export function setAccessToken(accessToken: string) {
      _Internal._accessToken = accessToken;
    }

    export function setActiveDocumentUrl(activeDocumentUrl: string) {
      _Internal._activeDocumentUrl = activeDocumentUrl;
    }

    export function getWorkbook(workbookUrl: string): Excel.Workbook {
      return _Internal.getWorkbook(workbookUrl);
    }

    export function getActiveWorkbook(): Excel.Workbook {
      if (_Internal._activeDocumentUrl === null) {
        throw new Error('You cannot use getActiveWorkbook() outside of Excel.');
      }
      return _Internal.getWorkbook(_Internal._activeDocumentUrl);
    }
  }
}

let rawPerfInfo: { [line_no: number]: { duration: number; frequency: number } } = {};
let activeTimers = {};
// todo clean up perf stuff
// let originalSyncSynchronous = (OfficeExtension.ClientRequestContext.prototype as any).syncSynchronous;

function start_perf_timer(line_no: number) {
  // activeTimers[line_no] = Date.now();
  // Experimental.ExcelMaker._Internal.contexts.forEach(context => {
  //     if (!context.originalSyncSynchronous) {
  //         context.originalSyncSynchronous = context.syncSynchronous;
  //     }
  //     context.syncSynchronous = () => {
  //         const current = rawPerfInfo[line_no] || { duration: 0, frequency: 0 };
  //         current.frequency += 1;
  //         rawPerfInfo[line_no] = current;
  //         context.originalSyncSynchronous();
  //     };
  // });
}

function stop_perf_timer(line_no: number) {
  // const timeElapsed = Date.now() - activeTimers[line_no];
  // const current = rawPerfInfo[line_no] || { duration: 0, frequency: 0 };
  // current.duration += timeElapsed;
  // rawPerfInfo[line_no] = current;
  // Experimental.ExcelMaker._Internal.contexts.forEach(context => {
  //     if (context.originalSyncSynchronous) {
  //         context.syncSynchronous = context.originalSyncSynchronous;
  //     }
  // });
}

function importScriptsFromReferences(scriptReferences: string[]) {
  scriptReferences.forEach(script => {
    if (script) {
      try {
        // ifVerbose(() => console.info(`attempting to load ${script}`));
        self.importScripts(script);
      } catch (error) {
        console.error(`Failed to load '${script}' for tinker() block!`);
      }
    }
  });
}

function sendPerfInfo() {
  const sendablePerfInfo: PerfInfoItem[] = [];
  // ifVerbose(() => console.log(JSON.stringify(rawPerfInfo, null, 4)));
  // tslint:disable-next-line:forin
  for (const line_no in rawPerfInfo) {
    const { duration, frequency } = rawPerfInfo[line_no];
    if (frequency > 0) {
      // todo remove
      sendablePerfInfo.push({
        line_no: Number(line_no),
        duration,
        frequency,
      });
    }
  }

  // processAndSendMessage('perfInfo', sendablePerfInfo);
}

self.addEventListener('message', (message: MessageEvent) => {
  ifVerbose(() => console.info('--------- starting tinker block ----------'));

  const {
    accessToken,
    activeDocumentUrl,
    makerCode,
    scriptReferences,
  }: ExecuteMakerScriptMessage = message.data;

  importScriptsFromReferences(scriptReferences);

  Experimental.ExcelMaker.setAccessToken(accessToken);
  Experimental.ExcelMaker.setActiveDocumentUrl(activeDocumentUrl);

  // ifVerbose(() => console.info(`documentUrl: ${activeDocumentUrl}`)); // for debugging

  let result = Experimental.ExcelMaker._Internal.runMakerFunction(makerCode);

  ifVerbose(() => {
    console.info('---------- finished tinker block ----------');
  });

  // sendPerfInfo();
  processAndSendMessage('result', result);

  rawPerfInfo = {};
});
