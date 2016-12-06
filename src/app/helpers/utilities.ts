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
