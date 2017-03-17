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
