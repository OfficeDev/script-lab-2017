import { Dictionary } from '@microsoft/office-js-helpers';
import { AI } from './ai.helper';
import { Observable } from 'rxjs/Observable';

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

export function processLibraries(snippet: ISnippet) {
    let linkReferences = [];
    let scriptReferences = [];
    let officeJS: string = null;

    snippet.libraries.split('\n').forEach(processLibrary);

    return { linkReferences, scriptReferences, officeJS };


    function processLibrary(text: string) {
        if (text == null || text.trim() === '') {
            return null;
        }

        text = text.trim();

        let isNotScriptOrStyle =
            /^#.*|^\/\/.*|^\/\*.*|.*\*\/$.*/im.test(text) ||
            /^@types/.test(text) ||
            /^dt~/.test(text) ||
            /\.d\.ts$/i.test(text);

        if (isNotScriptOrStyle) {
            return null;
        }

        let resolvedUrlPath = (/^https?:\/\/|^ftp? :\/\//i.test(text)) ? text : `https://unpkg.com/${text}`;

        if (/\.css$/i.test(resolvedUrlPath)) {
            return linkReferences.push(resolvedUrlPath);
        }

        if (/\.ts$|\.js$/i.test(resolvedUrlPath)) {
            /*
            * Don't add Office.js to the rest of the script references --
            * it is special because of how it needs to be *outside* of the iframe,
            * whereas the rest of the script references need to be inside the iframe.
            */
            if (/(?:office|office.debug).js$/.test(resolvedUrlPath.toLowerCase())) {
                officeJS = resolvedUrlPath;
                return null;
            }

            return scriptReferences.push(resolvedUrlPath);
        }

        return scriptReferences.push(resolvedUrlPath);
    }
}

export const safeguard = <T>(source: Observable<T>) =>
    source.catch<T, T>(error => Observable.throw(error));
