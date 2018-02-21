/* tslint:disable:no-namespace */
self.importScripts('sync-office-js'); // import sync office js code

const VERBOSE_LOG = false;

function ifVerbose(callback: () => void) {
    if (VERBOSE_LOG) {
        callback();
    }
}

// TODO: import any script that the user feels like.


// TODO: move these.

const consoleMethods = ['log', 'info', 'error'];
type ConsoleMethodType = 'log' | 'info' | 'error';
type MakerWorkerMessageType = ConsoleMethodType | 'result';

interface MakerWorkerMessage {
    type: MakerWorkerMessageType,
    content: string;
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


// TODO:  foreach.

// By setting "console", overwriting "self.console" which TS thinks is a read-only variable...
const oldConsole = console;
console = {
    ...oldConsole,
    log: item => processAndSendMessage(item, 'log'),
    info: item => processAndSendMessage(item, 'info'),
    error: item => processAndSendMessage(item, 'error')
};

function processAndSendMessage(content: any, type: MakerWorkerMessageType) {
    if (consoleMethods.indexOf(type) >= 0) {
        oldConsole[type](content);
    }

    postMessage({
        type,
        content: getHappilySerializeableContent()
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
                Object.getOwnPropertyNames(value).forEach(key => error[key] = value[key]);
                return error;
            }

            return value;
        }
    }
}


module Experimental {
    export module ExcelMaker {

        export module _Internal {
            export interface MockExcelContext {
                syncSynchronous(): void;
                trackedObjects: {
                    _retrieveAndClearAutoCleanupList(): OfficeExtension.ClientObject;
                    remove(item: OfficeExtension.ClientObject): void;
                },
                workbook: Excel.Workbook;
            }

            export let _accessToken: string;
            export let _activeDocumentUrl: string;
            export const contexts: MockExcelContext[] = [];

            export function getWorkbook(workbookUrl: string): Excel.Workbook {
                let context = getExcelContext(_accessToken, workbookUrl);
                contexts.push(context);
                return context.workbook;
            }

            export function runMakerFunction(makerCode: string) {
                let result: any;

                // TODO EVENTUALLY: figure out if eval is evil.

                // tslint:disable-next-line:no-eval
                eval(`result = ${makerCode}();`);

                cleanUpContexts();

                return result;
            };

            export function getExcelContext(accessToken: string, documentUrl: string): MockExcelContext {
                let sessionId = createSession(accessToken, documentUrl);

                let sessionInfo: RequestUrlAndHeaderInfo = {
                    url: documentUrl,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'workbook-session-id': sessionId
                    }
                };

                let ctx: any = new Excel.RequestContext(sessionInfo as any);
                ctx._autoCleanup = true;

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
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${documentUrl}/createSession`, false);

                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.setRequestHeader('content-type', 'application/json');

                xhr.send(null);

                if (xhr.readyState === 4 && xhr.status === 201) {
                    let response = JSON.parse(xhr.responseText);
                    return response.id;
                } else {
                    console.error('Request failed to create session.  Returned status of ' + xhr.status);
                    return null;
                }
            };

            export function closeSession(accessToken: string, documentUrl: string, sessionId: string): null {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${documentUrl}/closeSession`, false);

                xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.setRequestHeader('workbook-session-id', sessionId);

                xhr.send(null);

                if (!(xhr.readyState === 4 && xhr.status === 204)) {
                    console.error('Request failed to close session.  Returned status of ' + xhr.status);
                }

                return null;
            };

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

function importScriptsFromReferences(scriptReferences: string[]) {
    debugger;
    scriptReferences.forEach(script => {
        if (script) {
            try {
                ifVerbose(() => console.log(`attempting to load ${script}`));
                self.importScripts(script);
            } catch (error) {
                console.error(`Failed to load '${script}' for tinker() block!`);
            }
        }
    })
}


self.addEventListener('message', (message: MessageEvent) => {
    ifVerbose(() => console.log('----- message posted to worker -----'));

    const {accessToken, activeDocumentUrl, makerCode, scriptReferences}: ExecuteMakerScriptMessage = message.data;

    importScriptsFromReferences(scriptReferences);

    Experimental.ExcelMaker.setAccessToken(accessToken);
    Experimental.ExcelMaker.setActiveDocumentUrl(activeDocumentUrl);

    ifVerbose(() => console.log(`documentUrl: ${activeDocumentUrl}`));

    let result = Experimental.ExcelMaker._Internal.runMakerFunction(makerCode);

    ifVerbose(() => {
        console.log('maker code finished execution');
        console.log('----- worker finished processing message -----');
    });

    processAndSendMessage(result, 'result');
});
