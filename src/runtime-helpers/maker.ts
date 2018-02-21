/* tslint:disable:no-namespace */

module Experimental {
    export module ExcelMaker {
        type ConsoleMethodType = 'log' | 'info' | 'error';
        type MakerWorkerMessageType = ConsoleMethodType | 'result';

        interface MakerWorkerMessage {
            type: MakerWorkerMessageType;
            content: string;
        }

        interface ExecuteMakerScriptMessage {
            accessToken: string;
            makerCode: string;
            activeDocumentUrl: string;
            scriptReferences: string[];
        }

        let _clientId: string;
        let _scriptReferences: string[];
        let worker: Worker;

        export declare function getWorkbook(workbookUrl: string): Excel.Workbook;
        export declare function getActiveWorkbook(): Excel.Workbook;

        // todo figure out if this method can be hidden from intellisense
        /** Initializes the script references to pass to the worker.
         *  DO NOT CALL THIS METHOD, INTERNAL USE ONLY.
         * @param scriptReferences
         */
        export function _init(params: {
            scriptReferences: string[]
        }) {
            _scriptReferences = params.scriptReferences;
        };

        export function setup(clientId: string) {
            _clientId = clientId;
        }

        export async function tinker(makerCode: (workbook: Excel.Workbook) => any): Promise<any> {
            const accessToken = await ScriptLab.getAccessToken(_clientId);

            return new Promise(async (resolve, reject) => {
                if (!worker) {
                    worker = new Worker('./lib/worker');
                }

                worker.onerror = (...args) => {
                    console.error(args);
                    reject(args);
                };

                worker.onmessage = (message: MessageEvent) => {
                    let msg: MakerWorkerMessage = message.data;
                    if (msg.type === 'result') {
                        resolve(msg.content);
                        return;
                    }
                    console[msg.type](msg.content);
                };

                let activeDocumentUrl = await getActiveDocumentUrl(accessToken);

                worker.postMessage({
                    accessToken,
                    makerCode: makerCode.toString(),
                    activeDocumentUrl,
                    scriptReferences: _scriptReferences
                });
            });
        }

        async function getActiveDocumentUrl(accessToken: string) {
            return new Promise((resolve, reject) => {
                if (window && (window as any).Office && (window as any).Office.context) {
                    // get document url
                    let tempUrl = Office.context.document.url.replace('https://', '');
                    let graphBaseUrl = 'https://graph.microsoft.com/v1.0';

                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', `${graphBaseUrl}/me/drive`);
                    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                    xhr.setRequestHeader('content-type', 'application/json');
                    xhr.onload = () => {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            let driveType = JSON.parse(xhr.responseText).driveType;

                            if (['business', 'personal'].indexOf(driveType) < 0) {
                                throw new Error('Currently, ScriptLab can only find urls for files stored on OneDrive consumer and business.');
                            }

                            let sliceIndex = driveType === 'business' ? 4 : 3;
                            let path = tempUrl.split('/').slice(sliceIndex).join('/');
                            let documentUrl = `${graphBaseUrl}/me/drive/root:/${path}:/workbook`;

                            resolve(documentUrl);
                        } else {
                            throw new Error('Could not retrieve driveType.');
                        }
                    };

                    xhr.send();
                } else {
                    resolve(null);
                }
            });
        }
    }
}
