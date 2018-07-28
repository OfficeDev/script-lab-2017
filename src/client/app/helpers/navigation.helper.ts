import {
  storage,
  environment,
  post,
  trustedSnippetManager,
  isInsideOfficeApp,
  generateUrl,
} from './index';
import { getDisplayLanguage } from '../strings';
import { uniqBy } from 'lodash';
import { ensureFreshLocalStorage } from '../helpers';
import { isCustomFunctionScript } from '../helpers/snippet.helper';

export function navigateToRunCustomFunctions(payload?: any) {
  if (!payload) {
    payload = getRunnerCustomFunctionsPayload({
      loadFromOfficeJsPreviewCachedCopy: !Office.context.requirements.isSetSupported(
        'CustomFunctions',
        1.3
      ),
    });
  }

  const url = environment.current.config.runnerUrl + '/custom-functions/run';
  return post(url, payload);
}

export function navigateToCustomFunctionsDashboard(returnUrl: string) {
  window.location.href = generateUrl(
    environment.current.config.editorUrl + '/custom-functions.html',
    { returnUrl: encodeURIComponent(returnUrl) }
  );
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
    returnUrl: returnUrl,
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

export function getRunnerCustomFunctionsPayload(additionalInfo: {
  loadFromOfficeJsPreviewCachedCopy: boolean;
}) {
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

  const loadFromOfficeJsPreviewCachedCopy =
    additionalInfo.loadFromOfficeJsPreviewCachedCopy;

  let data: IRunnerCustomFunctionsPostData = {
    snippets: allSnippetsToRegisterWithPossibleDuplicate,
    loadFromOfficeJsPreviewCachedCopy: loadFromOfficeJsPreviewCachedCopy,
    displayLanguage: getDisplayLanguage(),
    heartbeatParams: {
      loadFromOfficeJsPreviewCachedCopy: loadFromOfficeJsPreviewCachedCopy,
      clientTimestamp: new Date().getTime(),
    },
    experimentationFlags: environment.current.experimentationFlags,
  };

  return { data: JSON.stringify(data) };
}
