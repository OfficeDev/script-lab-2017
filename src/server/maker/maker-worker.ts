self.importScripts('sync-office-js'); // import sync office js code

async function createSession(accessToken: string, documentUrl: string) {
    return new Promise((resolve: (sessionId: string) => any, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', `${documentUrl}/createSession`);

        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('content-type', 'application/json');

        xhr.onload = async () => {
            if (xhr.readyState === 4 && xhr.status === 201) {
                let response = JSON.parse(xhr.responseText);
                resolve(response.id);
            } else {
                console.error('Request failed.  Returned status of ' + xhr.status);
                reject('Request failed.  Returned status of ' + xhr.status);
            }
        };
        xhr.send(null);
    });
};

async function closeSession(accessToken: string, documentUrl: string, sessionId: string) {
    return new Promise((resolve: (sessionId: string) => any, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', `${documentUrl}/closeSession`);

        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.setRequestHeader('workbook-session-id', sessionId);

        xhr.onload = async () => {
            if (xhr.readyState === 4 && xhr.status === 204) {
                resolve(null);
            } else {
                console.error('Request failed.  Returned status of ' + xhr.status);
                reject('Request failed.  Returned status of ' + xhr.status);
            }
        };
        xhr.send(null);
    });
};

async function runMakerFunction(accessToken: string, documentUrl: string, sessionId: string, makerCode: string) {
    interface RequestUrlAndHeaderInfo {
        /** Request URL */
        url: string;
        /** Request headers */
        headers?: { [name: string]: string };
    }   // TODO: fix?

    let sessionInfo: RequestUrlAndHeaderInfo = {
        url: documentUrl,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'workbook-session-id': sessionId
        }
    };

    await Excel.run(sessionInfo as any, async ctx => {
        console.log('inside excel.run');
        let makerFunc: (workbook: Excel.Workbook) => any;
        eval(`makerFunc = ${makerCode};`);
        makerFunc(ctx.workbook);
    });
};


self.addEventListener('message', async (message: MessageEvent) => {
    console.log('----- message posted to worker -----');

    let accessToken: string = message.data[0];
    let documentUrl: string = message.data[1];
    let makerCode: string = message.data[2];

    let sessionId = await createSession(accessToken, documentUrl);
    console.log('session created');
    await runMakerFunction(accessToken, documentUrl, sessionId, makerCode);
    console.log('maker code finished execution');
    await closeSession(accessToken, documentUrl, sessionId);
    console.log('session closed');

    console.log('----- worker finished processing message -----');
});
