self.importScripts('sync-office-js'); // import sync office js code

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
                console.error('Request failed to create session.  Returned status of ' + xhr.status);
                reject('Request failed to create session.  Returned status of ' + xhr.status);
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
                console.error('Request failed to close session.  Returned status of ' + xhr.status);
                reject('Request failed to close session.  Returned status of ' + xhr.status);
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
    }

    let sessionInfo: RequestUrlAndHeaderInfo = {
        url: documentUrl,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'workbook-session-id': sessionId
        }
    };

    return await Excel.run(sessionInfo as any, async ctx => {
        console.log('inside excel.run');
        let makerFunc: (workbook: Excel.Workbook) => any;
        // TODO:  figure out if there are any reprecussions to using eval
        // tslint:disable-next-line:no-eval
        eval(`makerFunc = ${makerCode};`);
        return makerFunc(ctx.workbook);
    });
};


self.addEventListener('message', async (message: MessageEvent) => {
    console.log('----- message posted to worker -----');

    const [accessToken, documentUrl, makerCode]: [string, string, string] = message.data;

    console.log(`documentUrl: ${documentUrl}`);

    let sessionId = await createSession(accessToken, documentUrl);
    console.log('session created');
    let result = await runMakerFunction(accessToken, documentUrl, sessionId, makerCode);
    console.log('maker code finished execution');
    await closeSession(accessToken, documentUrl, sessionId);
    console.log('session closed');

    console.log('----- worker finished processing message -----');
    postMessage({
        type: MakerWorkerMessageTypes.Output,
        content: result,
    });
});
