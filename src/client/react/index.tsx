import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import ComingSoon from './components/CustomFunctionsDashboard/ComingSoon';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import {
  storage,
  environment,
  getIsCustomFunctionsSupportedOnHost,
  isCustomFunctionScript,
} from '../../client/app/helpers';
import { uniqBy } from 'lodash';
import { ensureFreshLocalStorage } from '../../client/app/helpers';
import { UI } from '@microsoft/office-js-helpers';
import { Strings } from '../app/strings';
import Welcome from './components/CustomFunctionsDashboard/Welcome';

const { localStorageKeys } = PLAYGROUND;

import '../assets/styles/extras.scss';

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""
tryCatch(async () => {
  environment.initializePartial({ host: 'EXCEL' });

  // clear out any former logs in the storage -- showing logs from a previous session is confusing
  window.localStorage.removeItem(localStorageKeys.log);

  // Now wait for the host.  The advantage of doing it this way is that you can easily
  // bypass it for debugging, just by entering "window.playground_host_ready = true;"
  // in the F12 debug console
  await new Promise(resolve => {
    const interval = setInterval(() => {
      if ((window as any).playground_host_ready) {
        clearInterval(interval);
        return resolve();
      }
    }, 100);
  });

  if (await getIsCustomFunctionsSupportedOnHost()) {
    initializeIcons();

    const { visual, functions } = await getCustomFunctionsInfo();

    // To allow debugging in a plain web browser, only try to register if the
    // Excel namespace exists.  It always will for an Add-in,
    // since it would have waited for Office to load before getting here
    if (typeof Excel !== 'undefined') {
      await registerMetadata(functions);
    }

    // Get the custom functions runner to reload as well
    let startOfRequestTime = new Date().getTime();
    window.localStorage.setItem(
      localStorageKeys.customFunctionsLastUpdatedCodeTimestamp,
      startOfRequestTime.toString()
    );

    document.getElementById('progress')!.style.display = 'none';

    if (visual.snippets.length > 0) {
      ReactDOM.render(<App metadata={visual} />, document.getElementById(
        'root'
      ) as HTMLElement);
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
    functions: ICFFunctionMetadata[];
    code: string;
  }>(async (resolve, reject) => {
    try {
      ensureFreshLocalStorage();

      if (!storage.snippets) {
        resolve({ visual: { snippets: [] }, functions: [], code: '' });
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

async function registerMetadata(functions: ICFFunctionMetadata[]) {
  // Register functions as ALLCAPS:
  functions.forEach(fn => (fn.name = fn.name.toUpperCase()));

  let fakeJson = {
    $schema:
      'https://developer.microsoft.com/en-us/json-schemas/office-js/custom-functions.schema.json',
    functions: [
      {
        name: 'ADD1000',
        description: 'adds 1000 to the input number',
        helpUrl: 'http://dev.office.com',
        result: {
          type: 'number',
          dimensionality: 'scalar',
        },
        parameters: [
          {
            name: 'number 1',
            description: 'the first number to be added',
            type: 'number',
            dimensionality: 'scalar',
          },
        ],
      },
    ],
  };

  if (Office.context.requirements.isSetSupported('CustomFunctions', 1.2)) {
    await Excel.run(async context => {
      (context.workbook.application as any).customFunctions.register(
        JSON.stringify(fakeJson, null, 4),
        `
        function add1000(input) {
          return 1000 + input;
        }
        CustomFunctionMappings["ADD1000"] = add1000;
        `

        //JSON.stringify({ functions: functions }),
      );
      await context.sync();
    });
  } else {
    // Older style registration
    await Excel.run(async context => {
      (context.workbook as any).registerCustomFunctions(
        'ScriptLab'.toUpperCase(),
        JSON.stringify({ functions: functions })
      );
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

  if (error instanceof Error) {
    UI.notify(error);
  } else {
    UI.notify(Strings().error, candidateErrorString);
  }
  document.getElementById('progress')!.style.display = 'none';
  document.getElementById('refresh').style.display = 'block';
}
