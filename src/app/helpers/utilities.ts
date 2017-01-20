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

export class Utilities {
    static storageSize(storage: any, key?: string, name?: string) {
        if (storage == null) {
            return;
        }

        let store = storage[key];
        if (store == null) {
            return;
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

    static stripSpaces(text: string) {
        let lines: string[] = (text || '').split('\n').map(function (item) {
            return item.replace(new RegExp('\t', 'g'), '    ');
        });

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

    static indentAllExceptFirstLine(text: string, numSpaces: number) {
        return Utilities.indentAllHelper(text, numSpaces, true /*excludeFirstLine*/);
    }

    static indentAll(text: string, numSpaces: number) {
        return Utilities.indentAllHelper(text, numSpaces, false /*excludeFirstLine*/);
    }

    private static indentAllHelper(text: string, numSpaces: number, excludeFirstLine: boolean) {
        let lines: string[] = (text || '').split('\n');
        let indentString = '';
        for (let i = 0; i < numSpaces; i++) {
            indentString += ' ';
        }

        let result = (excludeFirstLine) ? (lines.shift() + '\n') : '';
        result += lines.map((line) => indentString + line).join('\n');
        return result;
    }
}
