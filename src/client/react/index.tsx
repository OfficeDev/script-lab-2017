import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import ComingSoon from './components/CustomFunctionsDashboard/ComingSoon';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import {
  storage,
  environment,
  getCustomFunctionEngineStatus,
  isCustomFunctionScript,
  getScriptLabTopLevelNamespace,
} from '../app/helpers';
import { uniqBy, flatten } from 'lodash';
import { ensureFreshLocalStorage } from '../app/helpers';
import { UI } from '@microsoft/office-js-helpers';
import { Strings } from '../app/strings';
import Welcome from './components/CustomFunctionsDashboard/Welcome';

const { localStorageKeys } = PLAYGROUND;

import '../assets/styles/extras.scss';
import { clearLogStorage } from './components/CustomFunctionsDashboard/LogAndHeartbeatFetcher';

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""
tryCatch(async () => {
  await environment.initialize({ host: 'EXCEL' });

  // Now wait for the host.  The advantage of doing it this way is that you can easily
  //     bypass it for debugging.
  // To bypass when using F12 tools, enter the following into the console:
  /*
    Office.context.requirements = { isSetSupported: function() { return true; } };
    window.playground_host_ready = true;
  */
  await new Promise(resolve => {
    const interval = setInterval(() => {
      if ((window as any).playground_host_ready) {
        clearInterval(interval);
        return resolve();
      }
    }, 100);
  });

  const engineStatus = await getCustomFunctionEngineStatus();

  if (engineStatus.enabled) {
    initializeIcons();

    // clear out any former logs in the storage -- showing logs from a previous session is confusing
    await clearLogStorage(engineStatus);

    const { visual, code } = await getCustomFunctionsInfo();

    // To allow debugging in a plain web browser, only try to register if the
    // Excel namespace exists.  It always will for an Add-in,
    // since it would have waited for Office to load before getting here
    if (typeof Excel !== 'undefined') {
      const allFunctions: ICFVisualFunctionMetadata[] = flatten(
        visual.snippets.map(snippet => snippet.functions)
      );

      await registerMetadata(allFunctions, code);
    }

    // Get the custom functions runner to reload as well
    let startOfRequestTime = new Date().getTime();
    window.localStorage.setItem(
      localStorageKeys.customFunctionsLastUpdatedCodeTimestamp,
      startOfRequestTime.toString()
    );

    document.getElementById('progress')!.style.display = 'none';

    if (visual.snippets.length > 0) {
      ReactDOM.render(
        <App metadata={visual} engineStatus={engineStatus} />,
        document.getElementById('root') as HTMLElement
      );
    } else {
      ReactDOM.render(<Welcome />, document.getElementById('root') as HTMLElement);
    }
  } else {
    ReactDOM.render(<ComingSoon />, document.getElementById('root') as HTMLElement);
  }
});

async function getCustomFunctionsInfo() {
  return new Promise<{
    visual: ICFVisualMetadata;
    code: string;
  }>(async (resolve, reject) => {
    try {
      ensureFreshLocalStorage();

      if (!storage.snippets) {
        resolve({ visual: { snippets: [] }, code: '' });
        return;
      }

      let allSnippetsToRegister = uniqBy(
        // [storage.current.lastOpened].concat(storage.snippets.values()) // (Uncomment and test once support samples),
        storage.snippets.values(),
        'id'
      ).filter(
        snippet => snippet.script && isCustomFunctionScript(snippet.script.content)
      );

      let xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${environment.current.config.runnerUrl}/custom-functions/parse-metadata`
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

      const data: ICustomFunctionsMetadataRequestPostData = {
        snippets: allSnippetsToRegister,
      };

      xhr.send(
        JSON.stringify({
          data: JSON.stringify(data),
        })
      );
    } catch (e) {
      handleError(e);
    }
  });
}

async function registerMetadata(
  functions: ICFVisualFunctionMetadata[],
  code: string
): Promise<void> {
  const registrationPayload: ICustomFunctionsRegistrationApiMetadata = {
    functions: functions.filter(func => func.status === 'good').map(func => {
      let uppercasedFullName = func.nonCapitalizedFullName.toUpperCase();
      let schemaFunc: ICFSchemaFunctionMetadata = {
        id: uppercasedFullName,
        name: uppercasedFullName,
        description: func.description,
        options: func.options,
        result: func.result,
        parameters: func.parameters,
      };
      return schemaFunc;
    }),
  };

  const jsonMetadataString = JSON.stringify(registrationPayload, null, 4);

  if (Office.context.requirements.isSetSupported('CustomFunctions', 1.6)) {
    await (Excel as any).CustomFunctionManager.register(jsonMetadataString, code);
  } else {
    await Excel.run(async context => {
      if (Office.context.platform === Office.PlatformType.OfficeOnline) {
        const namespace = getScriptLabTopLevelNamespace().toUpperCase();
        (context.workbook as any).registerCustomFunctions(
          namespace,
          jsonMetadataString,
          '' /*addinId*/,
          'en-us',
          namespace
        );
      } else {
        (Excel as any).CustomFunctionManager.newObject(context).register(
          jsonMetadataString,
          code
        );
      }
      await context.sync();
    });
  }
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

  if (environment.current.devMode) {
    // tslint:disable-next-line:no-debugger
    debugger;
  }

  if (error instanceof Error) {
    UI.notify(error);
  } else {
    UI.notify(Strings().error, candidateErrorString);
  }
  document.getElementById('progress')!.style.display = 'none';
  document.getElementById('refresh').style.display = 'block';
}
