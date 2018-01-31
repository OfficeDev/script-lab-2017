/* tslint:disable:no-namespace */

module Experimental {
    export module ExcelMaker {
        let _clientId: string = undefined;
        const worker = new Worker('./lib/worker');

        export function setup(clientId: string) {
            _clientId = clientId;
        }

        export function tinker(documentUrl: string, makerCode: (workbook: Excel.Workbook) => any);
        export function tinker(makerCode: (workbook: Excel.Workbook) => any);
        export function tinker(arg1: (string | ((workbook: Excel.Workbook) => any)), arg2?: (workbook: Excel.Workbook) => any) {
            let makerCode: (workbook: Excel.Workbook) => any;
            let documentUrl: string;
            ScriptLab.getAccessToken(_clientId).then(accessToken => {
                if (typeof arg1 === 'string') {
                    documentUrl = arg1;
                    makerCode = arg2;

                    worker.postMessage([accessToken, documentUrl, makerCode.toString()]);
                } else {
                    makerCode = arg1;
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
                                    throw 'ScriptLab can only currently find urls for files stored on OneDrive consumer and business.';
                                }

                                let sliceIndex = driveType === 'business' ? 4 : 3;
                                let path = tempUrl.split('/').slice(sliceIndex).join('/');
                                let documentUrl = `${graphBaseUrl}/me/drive/root:/${path}:/workbook`;

                                worker.postMessage([accessToken, documentUrl, makerCode.toString()]);
                            } else {
                                throw 'Could not retrieve driveType.';
                            }
                        };
                        xhr.send();

                    } else {
                        throw 'You must specify a documentUrl if you are not inside of Excel!';
                    }
                }
            });
        }
    }
}
