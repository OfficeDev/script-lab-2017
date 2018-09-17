import { Dictionary } from '@microsoft/office-js-helpers';
import { AI } from './ai.helper';
import { toNumber } from 'lodash';
import * as semver from 'semver';
import { environment } from '.';
import { stringifyPlusPlus } from './standalone-log-helper';
import { isUndefined } from 'lodash';

// Note: a similar mapping exists in server.ts as well
const officeHosts = [
  'ACCESS',
  'EXCEL',
  'ONENOTE',
  'OUTLOOK',
  'POWERPOINT',
  'PROJECT',
  'WORD',
];

const officeHostsToAppNames = {
  ACCESS: 'Access',
  EXCEL: 'Excel',
  ONENOTE: 'OneNote',
  OUTLOOK: 'Outlook',
  POWERPOINT: 'PowerPoint',
  PROJECT: 'Project',
  WORD: 'Word',
};

export function isValidHost(host: string) {
  host = host.toUpperCase();
  return isOfficeHost(host) || host === 'WEB';
}

export function isOfficeHost(host: string) {
  return officeHosts.indexOf(host) >= 0;
}

export function getHostAppName(host: string) {
  return officeHostsToAppNames[host.toUpperCase()];
}

export function isInsideOfficeApp() {
  const Office = (window as any).Office;
  return Office && Office.context && Office.context.requirements;
}

export interface CustomFunctionEngineStatus {
  enabled: boolean;
  error?: string;
  nativeRuntime?: boolean;
}

let cachedCFEngineStatus;
export async function getCustomFunctionEngineStatus(): Promise<
  CustomFunctionEngineStatus
> {
  if (isUndefined(cachedCFEngineStatus)) {
    cachedCFEngineStatus = await queryCFEngineStatus();
  }

  return cachedCFEngineStatus;

  // Helpers:

  async function queryCFEngineStatus() {
    try {
      if (environment.current.experimentationFlags.customFunctions.forceOn) {
        return { enabled: true };
      }

      if (!Office.context.requirements.isSetSupported('CustomFunctions', 1.1)) {
        return { enabled: false };
      }

      const platform = Office.context.platform;

      if (platform === Office.PlatformType.PC) {
        if (!Office.context.requirements.isSetSupported('CustomFunctions', 1.3)) {
          return getPCstatusPre1_3();
        }
        return getStatusPost1_3();
      }

      if (
        platform === Office.PlatformType.Mac &&
        Office.context.requirements.isSetSupported('CustomFunctions', 1.3)
      ) {
        return getStatusPost1_3();
      }

      if (platform === Office.PlatformType.OfficeOnline) {
        // On Web: doesn't work yet, need to debug further. It might have to do with Web not expecting non-JSON-inputted functions.  For now, assume that it's off.
        return { enabled: false };
      }

      // Catch-all:
      return { enabled: false };
    } catch (e) {
      console.error('Could not perform a "getCustomFunctionEngineStatus" check');
      console.error(e);
      return { enabled: false };
    }
  }

  async function getPCstatusPre1_3(): Promise<CustomFunctionEngineStatus> {
    const threeDotVersion = /(\d+\.\d+\.\d+)/.exec(Office.context.diagnostics.version)[1];

    if (semver.lt(threeDotVersion, '16.0.9323')) {
      return { enabled: false };
    }

    return tryExcelRun(
      async (context): Promise<CustomFunctionEngineStatus> => {
        const featuresThatWantOn = [
          'Microsoft.Office.Excel.AddinDefinedFunctionEnabled',
          'Microsoft.Office.Excel.AddinDefinedFunctionStreamingEnabled',
          'Microsoft.Office.Excel.AddinDefinedFunctionCachingEnabled',
          'Microsoft.Office.Excel.AddinDefinedFunctionUseCalcThreadEnabled',
          'Microsoft.Office.OEP.UdfManifest',
          'Microsoft.Office.OEP.UdfRuntime',
        ].map(
          name =>
            (context as any).flighting
              .getFeatureGate(name)
              .load('value') as OfficeExtension.ClientResult<boolean>
        );

        const flightThatMustBeOffPre1_3 = (context as any).flighting
          .getFeatureGate('Microsoft.Office.OEP.SdxSandbox')
          .load('value') as OfficeExtension.ClientResult<boolean>;

        await context.sync();

        const firstNonTrueIndex = featuresThatWantOn.findIndex(
          item => item.value !== true
        );
        const allDesirableOnesWereTrue = firstNonTrueIndex < 0;
        if (!allDesirableOnesWereTrue) {
          return { enabled: false };
        }

        if (flightThatMustBeOffPre1_3.value) {
          return {
            error: `Conflict: please disable the "Microsoft.Office.OEP.SdxSandbox" flight, or install a newer version of Excel`,
            enabled: false,
          };
        }

        return {
          enabled: true,
          nativeRuntime: false /* older version, so can't have the native runtime there */,
        };
      }
    );
  }

  async function getStatusPost1_3(): Promise<CustomFunctionEngineStatus> {
    return tryExcelRun(
      async (context): Promise<CustomFunctionEngineStatus> => {
        const manager = (Excel as any).CustomFunctionManager.newObject(context).load(
          'status'
        );
        await context.sync();

        return {
          enabled: manager.status.enabled,
          nativeRuntime: manager.status.nativeRuntime,
        };
      }
    );
  }

  async function tryExcelRun(
    callback: (context: Excel.RequestContext) => Promise<CustomFunctionEngineStatus>
  ) {
    while (true) {
      try {
        return Excel.run(async context => await callback(context));
      } catch (e) {
        const isInCellEditMode =
          e instanceof OfficeExtension.Error &&
          e.code === Excel.ErrorCodes.invalidOperationInCellEditMode;
        if (isInCellEditMode) {
          await pause(2000);
          continue;
        } else {
          return { enabled: false };
        }
      }
    }
  }
}

export function getScriptLabTopLevelNamespace() {
  return 'ScriptLab' + (environment.current.devMode ? 'Dev' : '');
}

let typeCache = new Dictionary<boolean>();

/**
 * This function coerces a string into a string literal type.
 * Using tagged union types in TypeScript 2.0, this enables
 * powerful typechecking of our reducers.
 *
 * Since every action label passes through this function it
 * is a good place to ensure all of our action labels
 * are unique.
 */
export function type<T>(label: T | ''): T {
  if (typeCache.contains(label as string)) {
    throw new Error(`Action type "${label}" is not unique"`);
  }

  typeCache.add(label as string, true);

  return <T>label;
}

export function storageSize(storage: any, key?: string, name?: string) {
  if (storage == null) {
    return '';
  }

  let store = storage[key];
  if (store == null) {
    return '';
  }

  if (key) {
    let len = (store.length + key.length) * 2;
    AI.trackMetric(key, len / 1024);
    return `${(name || key).substr(0, 50)}  = ${(len / 1024).toFixed(2)} kB`;
  }

  let total = Object.keys(storage).reduce((total, key) => {
    let len = (store.length + key.length) * 2;
    console.log(`${key.substr(0, 50)}  = ${(len / 1024).toFixed(2)} kB`);
    return total + len;
  }, 0);

  return `Total = ${(total / 1024).toFixed(2)} KB`;
}

export function post(path: string, params: any) {
  let form = document.createElement('form');
  form.setAttribute('method', 'post');
  form.setAttribute('action', path);

  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      let hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', params[key]);
      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}

export function getGistUrl(id: string): string {
  return `https://gist.github.com/${id}`;
}

export function stringOrEmpty(text: string): string {
  if (text === null || text === undefined) {
    return '';
  }

  return text;
}

export function isNullOrWhitespace(text: string) {
  return text == null || text.trim().length === 0;
}

export function uppercaseMaybe(text: string, makeAllUppercase: boolean) {
  return makeAllUppercase ? text.toUpperCase() : text;
}

export function indentAll(text: string, indentSize: number) {
  let lines: string[] = stringOrEmpty(text).split('\n');
  let indentString = '';
  for (let i = 0; i < indentSize; i++) {
    indentString += '    ';
  }

  return lines.map(line => indentString + line).join('\n');
}

export function generateUrl(base: string, queryParams: any) {
  const result = [];
  for (const key in queryParams) {
    if (queryParams.hasOwnProperty(key)) {
      result.push(`${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`);
    }
  }

  if (result.length === 0) {
    return base;
  }

  return `${base}?${result.join('&')}`;
}

export function getVersionedPackageUrl(
  editorUrl: string,
  packageName: string,
  filename: string
) {
  return `${editorUrl}/libs/${
    (window as any).versionedPackageNames[packageName]
  }/${filename}`;
}

export function setUpMomentJsDurationDefaults(momentInstance: {
  relativeTimeThreshold(threshold: string, limit: number): boolean;
}) {
  momentInstance.relativeTimeThreshold('s', 40);
  // Note, per documentation, "ss" must be set after "s"
  momentInstance.relativeTimeThreshold('ss', 1);
  momentInstance.relativeTimeThreshold('m', 40);
  momentInstance.relativeTimeThreshold('h', 20);
  momentInstance.relativeTimeThreshold('d', 25);
  momentInstance.relativeTimeThreshold('M', 10);
}

export function stripSpaces(text: string) {
  let lines: string[] = text.split('\n');

  // Replace each tab with 4 spaces.
  for (let i: number = 0; i < lines.length; i++) {
    lines[i].replace('\t', '    ');
  }

  let isZeroLengthLine: boolean = true;
  let arrayPosition: number = 0;

  // Remove zero length lines from the beginning of the snippet.
  do {
    let currentLine: string = lines[arrayPosition];
    if (currentLine.trim() === '') {
      lines.splice(arrayPosition, 1);
    } else {
      isZeroLengthLine = false;
    }
  } while (isZeroLengthLine || arrayPosition === lines.length);

  arrayPosition = lines.length - 1;
  isZeroLengthLine = true;

  // Remove zero length lines from the end of the snippet.
  do {
    let currentLine: string = lines[arrayPosition];
    if (currentLine.trim() === '') {
      lines.splice(arrayPosition, 1);
      arrayPosition--;
    } else {
      isZeroLengthLine = false;
    }
  } while (isZeroLengthLine);

  // Get smallest indent for align left.
  let shortestIndentSize: number = 1024;
  for (let line of lines) {
    let currentLine: string = line;
    if (currentLine.trim() !== '') {
      let spaces: number = line.search(/\S/);
      if (spaces < shortestIndentSize) {
        shortestIndentSize = spaces;
      }
    }
  }

  // Align left
  for (let i: number = 0; i < lines.length; i++) {
    if (lines[i].length >= shortestIndentSize) {
      lines[i] = lines[i].substring(shortestIndentSize);
    }
  }

  // Convert the array back into a string and return it.
  let finalSetOfLines: string = '';
  for (let i: number = 0; i < lines.length; i++) {
    if (i < lines.length - 1) {
      finalSetOfLines += lines[i] + '\n';
    } else {
      finalSetOfLines += lines[i];
    }
  }
  return finalSetOfLines;
}

export function chooseRandomly<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function getElapsedTime(time: number) {
  return new Date().getTime() - time;
}

export function ensureFreshLocalStorage(): void {
  // Due to bug in IE (https://stackoverflow.com/a/40770399),
  // Local Storage may get out of sync across tabs.  To fix this,
  // set a value of some key, and this will ensure that localStorage is refreshed.
  window.localStorage.setItem(PLAYGROUND.localStorageKeys.dummyUnusedKey, null);
}

export function getNumberFromLocalStorage(key: string): number {
  ensureFreshLocalStorage();
  return toNumber(window.localStorage.getItem(key) || '0');
}

export function pushToLogQueue(entry: LogData) {
  ensureFreshLocalStorage();
  let currentLog = window.localStorage.getItem(PLAYGROUND.localStorageKeys.log) || '';
  let prefix = currentLog.length === 0 ? '' : '\n';
  window.localStorage.setItem(
    PLAYGROUND.localStorageKeys.log,
    currentLog +
      prefix +
      JSON.stringify({
        ...entry,
        message: stringifyPlusPlus(entry.message),
      })
  );
}

export function assertIdentical<T>(...args: T[]): T {
  const last = args.pop();
  while (args.length > 0) {
    const next = args.pop();
    if (next !== last) {
      throw new Error('Assert identical failed: ' + stringifyPlusPlus(args));
    }
  }
  return last;
}

export function pause(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
