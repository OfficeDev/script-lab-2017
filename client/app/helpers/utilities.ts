import { Dictionary } from '@microsoft/office-js-helpers';
import { AI } from './ai.helper';

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
        throw new Error(`Action type "${label}" is not unqiue"`);
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

export function queryParamsToJson(href: string): { [key: string]: string } {
    const indexOfQuestionMark = href.indexOf('?');
    if (indexOfQuestionMark < 0) {
        return {};
    }

    const allParams = href.substr(indexOfQuestionMark + 1).trim();
    if (allParams.length === 0) {
        return {};
    }

    const keyValuePairStrings = allParams.split('&');
    const result = {};
    keyValuePairStrings.forEach(item => {
        const split = item.split('=');
        if (split.length !== 2) {
            throw new Error('Invalid key-value pair for ' + item);
        }
        result[split[0]] = decodeURIComponent(split[1]);
    });

    return result;
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

export function stripSpaces(text: string) {
    let lines: string[] = stringOrEmpty(text).split('\n').map((item) => item.replace(new RegExp('	', 'g'), '    '));

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

export function indentAll(text: string, indentSize: number) {
    let lines: string[] = stringOrEmpty(text).split('\n');
    let indentString = '';
    for (let i = 0; i < indentSize; i++) {
        indentString += '    ';
    }

    return lines.map((line) => indentString + line).join('\n');
}

export function isUrl(entry: string): boolean {
    entry = entry.trim().toLowerCase();
    return entry.startsWith('http://') || entry.startsWith('https://') || entry.startsWith('//');
}

export function normalizeUrl(url: string): string {
    url = url.trim();
    if (isUrl(url)) {
        // strip out https: or http:
        return url.substr(url.indexOf('//'));
    } else {
        throw new Error('Could not normalize URL ' + url);
    }
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

export function replaceTabsWithSpaces(data: string): string {
    return data.replace(new RegExp('\t', 'g'), '    ');
}

export const randomize = (limit = 100000, start = 0) => Math.floor(Math.random() * limit + start);
