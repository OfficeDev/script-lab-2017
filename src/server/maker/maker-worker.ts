/* tslint:disable:no-namespace */
self.importScripts('sync-office-js'); // import sync office js code

// TODO: import any script that the user feels like.


// TODO: move these.

enum MakerWorkerMessageTypes {
    ConsoleInfo,
    ConsoleLog,
    ConsoleError,
    Output,
}

interface MakerWorkerMessage {
    type: MakerWorkerMessageTypes,
    content: string;
}

interface RequestUrlAndHeaderInfo {
    /** Request URL */
    url: string;
    /** Request headers */
    headers?: { [name: string]: string };
}


// TODO:  foreach.
// TODO:  keep old console too

// By setting "console", overwriting "self.console" which TS thinks is a read-only variable...
console = {
    ...console,
    log: (stuff) => {
        postMessage({
            type: MakerWorkerMessageTypes.ConsoleLog,
            content: stuff
        });
    },
    info: (stuff) => {
        postMessage({
            type: MakerWorkerMessageTypes.ConsoleInfo,
            content: stuff
        });
    },
    error: (stuff) => {
        postMessage({
            type: MakerWorkerMessageTypes.ConsoleError,
            content: stuff
        });
    },
};


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
            export const contexts: MockExcelContext[] = [];

            export function getWorkbook(workbookUrl: string): Excel.Workbook {
                let context = getExcelContext(_accessToken, workbookUrl);
                contexts.push(context);
                return context.workbook;
            }

            export function runMakerFunction(makerCode: string) {
                let makerFunc: () => any;

                // TODO EVENTUALLY: figure out if eval is evil.

                // tslint:disable-next-line:no-eval
                eval(`makerFunc = ${makerCode};`);

                let result = makerFunc();

                cleanUpContexts();

                return result;

                // return await Excel.run(sessionInfo as any, async ctx => {
                //     console.log('inside excel.run');
                //     let makerFunc: (workbook: Excel.Workbook) => any;
                //     // TODO:  figure out if there are any reprecussions to using eval
                //     // tslint:disable-next-line:no-eval
                //     eval(`makerFunc = ${makerCode};`);
                //     return makerFunc(ctx.workbook);
                // });
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
                        var itemsToRemove = ctx.trackedObjects._retrieveAndClearAutoCleanupList();
                        for (var key in itemsToRemove) {
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

        // TODO: make synchronous and return
        export function getWorkbook(workbookUrl: string): Excel.Workbook {
            return _Internal.getWorkbook(workbookUrl);
        }
    }
}



self.addEventListener('message', (message: MessageEvent) => {
    console.log('----- message posted to worker -----');

    const [accessToken, documentUrl, makerCode]: string[] = message.data;

    Experimental.ExcelMaker.setAccessToken(accessToken);

    console.log(`documentUrl: ${documentUrl}`);

    // let sessionId = await createSession(accessToken, documentUrl);
    // console.log('session created');
    let result = Experimental.ExcelMaker._Internal.runMakerFunction(makerCode);
    console.log('maker code finished execution');
    // await closeSession(accessToken, documentUrl, sessionId);
    // console.log('session closed');

    console.log('----- worker finished processing message -----');
    postMessage({
        type: MakerWorkerMessageTypes.Output,
        content: result,
    });
});
