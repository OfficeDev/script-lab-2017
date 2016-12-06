import { Dictionary } from '@microsoft/office-js-helpers';

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
    return function assign(property: any, value?: any): T {
        if (arguments!.length === 0) {
            return obj as T;
        }
        else if (_.isObject(property)) {
            console.log(property);
            return _.assign({}, obj, property) as T;
        }
        else if (_.isString(property)) {
            obj[property] = value;
            console.log(property, value);
        }
        return assign as any;
    };
};


export class Utilities {
    static storageSize(storage: any, key?: string) {
        if (storage == null) {
            return;
        }

        if (key) {
            let len = ((storage[key].length + key.length) * 2);
            return `${key.substr(0, 50)}  = ${(len / 1024).toFixed(2)} kB`;
        }

        let total = Object.keys(storage).reduce((total, key) => {
            let len = ((storage[key].length + key.length) * 2);
            console.log(`${key.substr(0, 50)}  = ${(len / 1024).toFixed(2)} kB`);
            return total + len;
        }, 0);

        return `Total = ${(total / 1024).toFixed(2)} KB`;
    }
}
