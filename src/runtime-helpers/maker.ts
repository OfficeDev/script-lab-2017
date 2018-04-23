/* tslint:disable:no-namespace */

module Experimental {
    export module ExcelMaker {
        type ConsoleMethodType = 'log' | 'info' | 'error';
        type MakerWorkerMessageType = ConsoleMethodType | 'result' | 'perfInfo';

        interface MakerWorkerMessage<T> {
            type: MakerWorkerMessageType;
            content: T;
        }

        interface ExecuteMakerScriptMessage {
            accessToken: string;
            makerCode: string;
            activeDocumentUrl: string;
            scriptReferences: string[];
        }

        // NOTE: this is a duplicated interface located in maker-interfaces.d.ts
        interface PerfInfoItem {
            line_no: number;
            frequency: number;
            duration: number;
        };

        let _scriptReferences: string[];
        let _onPerfAnalysisReady: (perfInfo: PerfInfoItem[]) => void;

        let worker: Worker;

        export declare function getWorkbook(workbookUrl: string): Excel.Workbook;
        export declare function getActiveWorkbook(): Excel.Workbook;

        // todo figure out if this method can be hidden from intellisense
        /** Initializes the script references to pass to the worker.
         *  DO NOT CALL THIS METHOD, INTERNAL USE ONLY.
         */
        export function _init(params: {
            scriptReferences: string[],
            onPerfAnalysisReady: (perfInfo: any[] /*aka PerfInfoItem[]*/) => void;
        }) {
            _scriptReferences = params.scriptReferences;
            _onPerfAnalysisReady = params.onPerfAnalysisReady;
        };

        export async function tinker(makerCode:() => any): Promise<any> {
            let runCurtain = parent.window.document.getElementById('curtain');
            runCurtain.style['display'] = 'block';
            try {
                const accessToken = await ScriptLab.getAccessToken();

                return new Promise(async (resolve, reject) => {
                    if (!worker) {
                        worker = new Worker('./lib/worker');
                    }

                    worker.onerror = (...args) => {
                        console.error(args);
                        runCurtain.style['display'] = 'none';
                        reject(args);
                    };

                    worker.onmessage = (message: MessageEvent) => {
                        let msg: MakerWorkerMessage<any> = message.data;
                        if (msg.type === 'result') {
                            runCurtain.style['display'] = 'none';
                            resolve(msg.content);
                            return;
                        } else if (msg.type === 'perfInfo') {
                            _onPerfAnalysisReady(msg.content);
                        } else {
                            console[msg.type](msg.content);
                        }
                    };

                    let activeDocumentUrl = await getActiveDocumentUrl(accessToken);

                    worker.postMessage({
                        accessToken,
                        makerCode: makerCode.toString(),
                        activeDocumentUrl,
                        scriptReferences: _scriptReferences
                    });
                });
            } catch (e) {
                console.error(e);
                runCurtain.style['display'] = 'none';
            }
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

                            let sliceIndex = driveType === 'business' ? 4 : 2;
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
