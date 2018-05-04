import {
  storage,
  environment,
  post,
  trustedSnippetManager,
  isInsideOfficeApp,
} from './index';
import { getDisplayLanguage } from '../strings';
import { uniqBy } from 'lodash';
import { ensureFreshLocalStorage } from '../helpers';
import { isCustomFunctionScript } from '../helpers/snippet.helper';

export function navigateToRunCustomFunctions(payload?: any) {
  if (!payload) {
    payload = getRunnerCustomFunctionsPayload();
  }

  const url = environment.current.config.runnerUrl + '/custom-functions/run';
  return post(url, payload);
}

export function navigateToRunner(snippet: ISnippet, returnUrl: string) {
  const overrides = <ISnippet>{
    host: environment.current.host,
    platform: environment.current.platform,
  };

  const state: IRunnerState = {
    snippet: { ...snippet, ...overrides },
    displayLanguage: getDisplayLanguage(),
    isInsideOfficeApp: isInsideOfficeApp(),
  };
  const data = JSON.stringify(state);
  const isTrustedSnippet = trustedSnippetManager.isSnippetTrusted(
    snippet.id,
    snippet.gist,
    snippet.gistOwnerId
  );

  return post(environment.current.config.runnerUrl + '/compile/page', {
    data,
    isTrustedSnippet,
  });
}

export function getRunnerCustomFunctionsPayload() {
  ensureFreshLocalStorage();
  let allSnippetsToRegisterWithPossibleDuplicate: ICustomFunctionsRunnerRelevantData[] = uniqBy(
    [storage.current.lastOpened].concat(storage.snippets.values()),
    'id'
  )
    .filter(snippet =>
      trustedSnippetManager.isSnippetTrusted(
        snippet.id,
        snippet.gist,
        snippet.gistOwnerId
      )
    )
    .filter(
      snippet =>
        snippet.script && isCustomFunctionScript(snippet.script.content)
    )
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
    },
  };

  return { data: JSON.stringify(data) };
}
