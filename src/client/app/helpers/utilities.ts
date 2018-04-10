import { Dictionary } from '@microsoft/office-js-helpers';
import { AI } from './ai.helper';
import { isString, isArray, toNumber } from 'lodash';

// Note: a similar mapping exists in server.ts as well
const officeHosts = ['ACCESS', 'EXCEL', 'ONENOTE', 'OUTLOOK', 'POWERPOINT', 'PROJECT', 'WORD'];

const officeHostsToAppNames = {
    'ACCESS': 'Access',
    'EXCEL': 'Excel',
    'ONENOTE': 'OneNote',
    'OUTLOOK': 'Outlook',
    'POWERPOINT': 'PowerPoint',
    'PROJECT': 'Project',
    'WORD': 'Word'
};

export function isValidHost(host: string) {
    host = host.toUpperCase();
    return isOfficeHost(host) || (host === 'WEB');
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
        let len = ((store.length + key.length) * 2);
        AI.trackMetric(key, len / 1024);
        return `${(name || key).substr(0, 50)}  = ${(len / 1024).toFixed(2)} kB`;
    }

    let total = Object.keys(storage).reduce((total, key) => {
        let len = ((store.length + key.length) * 2);
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

export function indentAll(text: string, indentSize: number) {
    let lines: string[] = stringOrEmpty(text).split('\n');
    let indentString = '';
    for (let i = 0; i < indentSize; i++) {
        indentString += '    ';
    }

    return lines.map((line) => indentString + line).join('\n');
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

export function getVersionedPackageUrl(editorUrl: string, packageName: string, filename: string) {
    return `${editorUrl}/libs/${(window as any).versionedPackageNames[packageName]}/${filename}`;
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
    } while (isZeroLengthLine || (arrayPosition === lines.length));

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
        }
        else {
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
    window.localStorage.setItem(PLAYGROUND.localStorageKeys.log,
        currentLog + prefix + JSON.stringify({
            ...entry,
            message: stringifyPlusPlus(entry.message)
        }));
}

export function stringifyPlusPlus(object) {
    if (object === null) {
        return 'null';
    }

    if (typeof object === 'undefined') {
        return 'undefined';
    }

    // Don't JSON.stringify strings, because we don't want quotes in the output
    if (isString(object)) {
        return object;
    }

    if (object.toString() !== '[object Object]') {
        return object.toString();
    }

    // Otherwise, stringify the object

    return JSON.stringify(object, (key, value) => {
        if (value && typeof value === 'object' && !isArray(value)) {
            return getStringifiableSnapshot(value);
        }
        return value;
    }, 4);

    function getStringifiableSnapshot(object: any) {
        const snapshot: any = {};

        try {
            let current = object;

            do {
                Object.keys(current).forEach(tryAddName);
                current = Object.getPrototypeOf(current);
            } while (current);

            return snapshot;
        } catch (e) {
            return object;
        }

        function tryAddName(name: string) {
            const hasOwnProperty = Object.prototype.hasOwnProperty;
            if (name.indexOf(' ') < 0 &&
                !hasOwnProperty.call(snapshot, name)) {
                Object.defineProperty(snapshot, name, {
                    configurable: true,
                    enumerable: true,
                    get: () => object[name]
                });
            }
        }
    }
}
