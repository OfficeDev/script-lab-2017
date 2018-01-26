/* tslint:disable:no-namespace */

module Experimental {
    export module ExcelMaker {
        let _clientId: string = undefined;
        const worker = new Worker('./lib/worker');


        export function setup(clientId: string) {
            _clientId = clientId;
            // ScriptLab.getAccessToken(clientId);
        }
        export function tinker(documentUrl: string, makerCode: (workbook: Excel.Workbook) => any);
        export function tinker(makerCode: (workbook: Excel.Workbook) => any);
        export function tinker(arg1: (string | ((workbook: Excel.Workbook) => any)), arg2?: (workbook: Excel.Workbook) => any) {
            let makerCode: (workbook: Excel.Workbook) => any;
            let documentUrl: string;
            console.log(arg1, arg2);
            if (typeof arg1 === 'string') {
                documentUrl = arg1;
                makerCode = arg2;
            } else {
                makerCode = arg1;

                if (Office) {
                    // get document url
                    let tempUrl = Office.context.document.url;
                    console.log(tempUrl);
                } else {
                    throw 'You must specify a documentUrl if you are not inside of Excel!';
                }
            }
            ScriptLab.getAccessToken(_clientId).then(accessToken => {
                worker.postMessage([accessToken, documentUrl, makerCode.toString()])
            });
        }
    }
}