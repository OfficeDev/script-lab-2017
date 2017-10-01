import { storage, environment, post, trustedSnippetManager } from '../app/helpers';

(async () => {
    await environment.initialize();

    let allSnippetsToRegister =
        ([storage.current.lastOpened].concat(storage.snippets.values()))
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .map(snippet => {
                let { name, customFunctions, libraries } = snippet;
                return { name, customFunctions, libraries };
            });

    return post(environment.current.config.runnerUrl + '/compile/custom-functions', {
        snippets: allSnippetsToRegister
    });
})();
