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

export function updateState<T>(state: T) {
    let obj = _.assign({}, state);
    return function assign(data: T): T {
        if (arguments!.length === 0) {
            return obj as T;
        }
        else if (_.isObject(data)) {
            return _.assign({}, obj, data) as T;
        }
        return assign as any;
    };
};

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
        AI.current.trackMetric(key, len / 1024);
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
