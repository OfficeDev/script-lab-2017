import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import ComingSoon from './components/CustomFunctionsDashboard/ComingSoon';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { storage, environment } from '../../client/app/helpers';
// import { getDisplayLanguage } from '../../client/app/strings';
import { uniqBy } from 'lodash';
import { ensureFreshLocalStorage } from '../../client/app/helpers';
import { isCustomFunctionScript } from '../../server/core/snippet.helper';
import { UI } from '@microsoft/office-js-helpers';
import { Strings } from '../app/strings';

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""

tryCatch(async () => {
  environment.initializePartial({ host: 'EXCEL' });

  await new Promise(resolve => {
    const interval = setInterval(() => {
      if ((window as any).playground_host_ready) {
        clearInterval(interval);
        return resolve();
      }
    }, 100);
  });

  if (
    Office &&
    Office.context &&
    Office.context.requirements &&
    Office.context.requirements.isSetSupported('CustomFunctions', 1.1)
  ) {
    initializeIcons();

    const {
      metadata,
      registerCustomFunctionsJsonStringBase64,
    } = await getMetadata();

    await registerMetadata(registerCustomFunctionsJsonStringBase64);

    document.getElementById('loading')!.style.display = 'none';
    ReactDOM.render(
      <App metadata={(metadata as any).snippets} />,
      document.getElementById('root') as HTMLElement
    );
  } else {
    ReactDOM.render(<ComingSoon />, document.getElementById(
      'root'
    ) as HTMLElement);
  }
});

async function getMetadata() {
  return new Promise<{
    metadata: object[];
    registerCustomFunctionsJsonStringBase64: string;
  }>(async (resolve, reject) => {
    ensureFreshLocalStorage();
    try {
      console.log(storage);

      if (!storage.snippets) {
        resolve({ metadata: [], registerCustomFunctionsJsonStringBase64: '' });
        return;
      }

      let allSnippetsToRegisterWithPossibleDuplicate = uniqBy(
        // [storage.current.lastOpened].concat(storage.snippets.values()),
        storage.snippets.values(),
        'id'
      ).filter(
        snippet =>
          snippet.script && isCustomFunctionScript(snippet.script.content)
      );

      let xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${
          environment.current.config.runnerUrl
        }/custom-functions/parse-metadata`
      );
      xhr.setRequestHeader('content-type', 'application/json');

      xhr.onload = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject();
        }
      };

      xhr.send(
        JSON.stringify({
          snippets: allSnippetsToRegisterWithPossibleDuplicate,
        })
      );
    } catch (e) {
      handleError(e);
    }
  });
}

async function registerMetadata(
  registerCustomFunctionsJsonStringBase64: string
) {
  const registrationPayload = atob(registerCustomFunctionsJsonStringBase64);
  await Excel.run(async context => {
    (context.workbook as any).registerCustomFunctions(
      'ScriptLab',
      registrationPayload
    );
    await context.sync();
  });
}

async function tryCatch(callback: () => void) {
  try {
    await callback();
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: Error) {
  let candidateErrorString = error.message || error.toString();
  if (candidateErrorString === '[object Object]') {
    candidateErrorString = Strings().unexpectedError;
  }

  if (error instanceof Error) {
    UI.notify(error);
  } else {
    UI.notify(Strings().error, candidateErrorString);
  }
}
