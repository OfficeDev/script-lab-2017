import { storage, environment, post, trustedSnippetManager } from './index';
import { getDisplayLanguage } from '../strings';
import { uniqBy } from 'lodash';
import {
    ensureFreshLocalStorage
} from '../helpers';
import { isCustomFunctionScript } from '../../../server/core/snippet.helper';

export function navigateToRegisterCustomFunctions() {
    ensureFreshLocalStorage();
    let allSnippetsToRegisterWithPossibleDuplicate: ISnippet[] =
        uniqBy([storage.current.lastOpened].concat(storage.snippets.values()), 'id')
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .filter(snippet => snippet.script && isCustomFunctionScript(snippet.script.content));

    let data: IRegisterCustomFunctionsPostData = {
        snippets: allSnippetsToRegisterWithPossibleDuplicate,
        displayLanguage: getDisplayLanguage(),
    };

    const url = environment.current.config.runnerUrl + '/custom-functions/register';
    return post(url, { data: JSON.stringify(data) });
}

export function navigateToRunCustomFunctions(payload?: any) {
    if (!payload) {
        payload = getRunnerCustomFunctionsPayload();
    }

    const url = environment.current.config.runnerUrl + '/custom-functions/run';
    return post(url, payload);
}

export function getRunnerCustomFunctionsPayload() {
    ensureFreshLocalStorage();
    let allSnippetsToRegisterWithPossibleDuplicate: ICustomFunctionsRunnerRelevantData[] =
        uniqBy([storage.current.lastOpened].concat(storage.snippets.values()), 'id')
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .filter(snippet => snippet.script && isCustomFunctionScript(snippet.script.content))
            .map(snippet => {
                return {
                    name: snippet.name,
                    id: snippet.id,
                    libraries: snippet.libraries,
                    script: snippet.script,
                    metadata: undefined,
                };
            });

    let data: IRunnerCustomFunctionsPostData = {
        snippets: allSnippetsToRegisterWithPossibleDuplicate,
        displayLanguage: getDisplayLanguage(),
        heartbeatParams: {
            clientTimestamp: new Date().getTime(),
            showDebugLog: environment.getExperimentationFlagValue('customFunctionsShowDebugLog')
        }
    };

    return { data: JSON.stringify(data) };
}
