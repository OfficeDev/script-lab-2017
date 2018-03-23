import { storage, environment, post, trustedSnippetManager } from './index';
import { getDisplayLanguage } from '../strings';
import { uniqBy } from 'lodash';

export function navigateToRegisterCustomFunctions() {
    let allSnippetsToRegisterWithPossibleDuplicate: ICustomFunctionsRegistrationRelevantData[] =
        uniqBy([storage.current.lastOpened].concat(storage.snippets.values()), 'id')
            .filter(snippet => trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId))
            .filter(snippet => snippet.customFunctions && snippet.customFunctions.content && snippet.customFunctions.content.trim().length > 0)
            .map((snippet): ICustomFunctionsRegistrationRelevantData => {
                try {
                    return {
                        name: snippet.name,
                        data: JSON.parse(snippet.customFunctions.content)
                    };
                }
                catch {
                    throw new Error(`Error parsing metadata for snippet "${snippet.name}"`);
                }
            });

    let data: IRegisterCustomFunctionsPostData = {
        snippets: allSnippetsToRegisterWithPossibleDuplicate,
        displayLanguage: getDisplayLanguage()
    };

    const url = environment.current.config.runnerUrl + '/register/custom-functions';
    return post(url, { data: JSON.stringify(data) });
}
