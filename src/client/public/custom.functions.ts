import { storage, environment, post, trustedSnippetManager } from '../app/helpers';

(async () => {
    await environment.initialize();

    let allSnippetsToRegister =
        ([storage.current.lastOpened].concat(storage.snippets.values()))
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .map(snippet => {
                let { name, customFunctions, libraries, id } = snippet;
                return { name, customFunctions, libraries, id };
            });

    let options: ICompileCustomFunctionsState = {
        snippets: allSnippetsToRegister,
        mode: 'run',
        clientTimestamp: new Date().getTime()
    };
    return post(environment.current.config.runnerUrl + '/compile/custom-functions', options);
})();
