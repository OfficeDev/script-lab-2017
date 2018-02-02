/* tslint:disable:no-namespace */

module Experimental {
    export module ExcelMaker {

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

        let _clientId: string;
        let worker: Worker;

        export declare function getWorkbook(workbookUrl: string): Excel.Workbook;

        export function setup(clientId: string) {
            _clientId = clientId;
        }

        export async function tinker(documentUrl: string, makerCode: (workbook: Excel.Workbook) => any): Promise<any>;
        export async function tinker(makerCode: (workbook: Excel.Workbook) => any): Promise<any>;
        export async function tinker(arg1: (string | ((workbook: Excel.Workbook) => any)), arg2?: (workbook: Excel.Workbook) => any): Promise<any> {

            let makerCode: (workbook: Excel.Workbook) => any;
            let documentUrl: string;
            const accessToken = await ScriptLab.getAccessToken(_clientId);

            return new Promise((resolve, reject) => {
                if (!worker) {
                    worker = new Worker('./lib/worker');
                }

                worker.onerror = (...args) => {
                    console.error(args);
                    reject(args);
                };

                worker.onmessage = (message: MessageEvent) => {
                    let msg: MakerWorkerMessage = message.data;
                    if (msg.type === MakerWorkerMessageTypes.Output) {
                        resolve(msg.content);
                    } else if (msg.type === MakerWorkerMessageTypes.ConsoleInfo) {
                        console.info(msg.content);
                    } else if (msg.type === MakerWorkerMessageTypes.ConsoleLog) {
                        console.log(msg.content);
                    } else if (msg.type === MakerWorkerMessageTypes.ConsoleError) {
                        console.error(msg.content);
                    }
                };
                // TODO:  ensure that you're returning a Promise once the window completes

                worker.postMessage([accessToken, null, arg1.toString()]);

                // if (typeof arg1 === 'string') {
                //     documentUrl = arg1;
                //     makerCode = arg2;

                //     worker.postMessage([accessToken, documentUrl, makerCode.toString()]);
                // } else {
                //     makerCode = arg1;
                //     if (window && (window as any).Office && (window as any).Office.context) {
                //         // get document url
                //         let tempUrl = Office.context.document.url.replace('https://', '');
                //         let graphBaseUrl = 'https://graph.microsoft.com/v1.0';

                //         let xhr = new XMLHttpRequest();
                //         xhr.open('GET', `${graphBaseUrl}/me/drive`);
                //         xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                //         xhr.setRequestHeader('content-type', 'application/json');
                //         xhr.onload = () => {
                //             if (xhr.readyState === 4 && xhr.status === 200) {
                //                 let driveType = JSON.parse(xhr.responseText).driveType;

                //                 if (['business', 'personal'].indexOf(driveType) < 0) {
                //                     throw new Error('ScriptLab can only currently find urls for files stored on OneDrive consumer and business.');
                //                 }

                //                 let sliceIndex = driveType === 'business' ? 4 : 3;
                //                 let path = tempUrl.split('/').slice(sliceIndex).join('/');
                //                 let documentUrl = `${graphBaseUrl}/me/drive/root:/${path}:/workbook`;

                //                 worker.postMessage([accessToken, documentUrl, makerCode.toString()]);
                //             } else {
                //                 throw new Error('Could not retrieve driveType.');
                //             }
                //         };

                //         xhr.send();

                //     } else {
                //         throw new Error('You must specify a documentUrl if you are not inside of Excel!');
                //     }
                // }
            });
        }
    }
}
