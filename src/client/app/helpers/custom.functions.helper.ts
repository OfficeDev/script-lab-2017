import { storage, environment, post, trustedSnippetManager } from './index';
import { getDisplayLanguage } from '../strings';
import { uniqBy } from 'lodash';

export function navigateToCompileCustomFunctions(mode: 'run' | 'register', payload?: any) {
    if (!payload) {
        payload = getCompileCustomFunctionsPayload(mode);
    }
    const url = environment.current.config.runnerUrl + '/compile/custom-functions';
    return post(url, payload);
}

export function getCompileCustomFunctionsPayload(mode: 'run' | 'register') {
    let allSnippetsToRegisterWithPossibleDuplicate =
        ([storage.current.lastOpened].concat(storage.snippets.values()))
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .filter(snippet => snippet.customFunctions && snippet.customFunctions.content && snippet.customFunctions.content.trim().length > 0)
            .map(snippet => {
                let { name, customFunctions, libraries, id } = snippet;
                return { name, customFunctions, libraries, id };
            });

    let options: ICompileCustomFunctionsState = {
        snippets: uniqBy(allSnippetsToRegisterWithPossibleDuplicate, item => item.id),
        mode,
        heartbeatParams: {
            clientTimestamp: new Date().getTime()
        },

        displayLanguage: getDisplayLanguage()
    };

    return { data: JSON.stringify(options) };
}
