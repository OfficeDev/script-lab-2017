import {Http} from '@angular/http';

export interface IIntelliSenseResponse {
    url: string,
    success: boolean,
    data?: string,
    error?: string
}

export class IntelliSenseHelper {
    private static previouslyFetchedLibs: { [key: string]: string } = { };

    static retrieveIntelliSense(http: Http, urls: string[]): Promise<IIntelliSenseResponse[]> {
        var timeout = 10000;

        var promises = urls.map(url => {
            if (IntelliSenseHelper.previouslyFetchedLibs[url]) {
                console.log("IntelliSense for " + url + " already cached; re-using it");
                return createSuccessResponseFromLib();
            }

            // Otherwise, attempt to retrieve:
            return http.get(url)
                .timeout(timeout, new Error("Server took too long to respond to " + url))
                .toPromise()
                .then((data) => {
                    IntelliSenseHelper.previouslyFetchedLibs[url] = data.text();
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
                    data: IntelliSenseHelper.previouslyFetchedLibs[url],
                };
            }
        });

        return <any>Promise.all(promises);
    }
}