import {Http} from '@angular/http';

export interface IIntelliSenseResponse {
    url: string,
    success: boolean,
    data?: string,
    error?: string
}

export class IntelliSenseHelper {
    private static _previouslyFetchedLibs: { [key: string]: string } = { };
    private static _currentMonacoAddedLibs: monaco.IDisposable[] = [];

    static retrieveIntelliSense(http: Http, urls: string[]): Promise<IIntelliSenseResponse[]> {
        var timeout = 10000;

        var promises = urls.map(url => {
            if (IntelliSenseHelper._previouslyFetchedLibs[url]) {
                console.log("IntelliSense for " + url + " already cached; re-using it");
                return createSuccessResponseFromLib();
            }

            // Otherwise, attempt to retrieve:
            return http.get(url)
                .timeout(timeout, new Error("Server took too long to respond to " + url))
                .toPromise()
                .then((data) => {
                    IntelliSenseHelper._previouslyFetchedLibs[url] = data.text();
                    return createSuccessResponseFromLib();
                })
                .catch((e) => {
                    return <IIntelliSenseResponse> {
                        url: url,
                        success: false,
                        error: e
                    };
                });


            function createSuccessResponseFromLib() {
                return <IIntelliSenseResponse> {
                    url: url,
                    success: true,
                    data: IntelliSenseHelper._previouslyFetchedLibs[url],
                };
            }
        });

        return <any>Promise.all(promises);
    }

    static disposeAllMonacoLibInstances() {
        IntelliSenseHelper._currentMonacoAddedLibs.forEach(lib => lib.dispose());
        IntelliSenseHelper._currentMonacoAddedLibs = [];
    }

    static recordNewlyAddedLib(lib: monaco.IDisposable) {
        IntelliSenseHelper._currentMonacoAddedLibs.push(lib);
    }
}