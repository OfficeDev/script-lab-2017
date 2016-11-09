import * as _ from 'lodash';

export class Utilities {
    static stripSpaces(text: string): string {
        if (_.isEmpty(text)) {
            return '';
        }

        let lines: string[] = text.trim().split('\n').map(item => {
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

    static indentAll(text: string, indentSize: number) {
        if (_.isEmpty(text)) {
            return '';
        }

        let lines: string[] = text.trim().split('\n');
        let indentString = '';
        for (let i = 0; i < indentSize; i++) {
            indentString += '    ';
        }

        return lines.map((line) => indentString + line).join('\n');
    }

    static stringifyPlusPlus(object): string {
        // Don't JSON.stringify strings, because we don't want quotes in the output
        if (object === null) {
            return 'null';
        }
        if (_.isUndefined(object)) {
            return 'undefined';
        }
        if (_.isString(object)) {
            return object;
        }
        if (_.isArray(object)) {
            return '[' + (<any[]>object).map((item) => Utilities.stringifyPlusPlus(item)).join(', ') + ']';
        }
        if (object.toString() !== '[object Object]') {
            return object.toString();
        }

        // Otherwise, stringify the object

        return JSON.stringify(object, (key, value) => {
            if (value && typeof value === 'object' && !$.isArray(value)) {
                return getStringifiableSnapshot(value);
            }
            return value;
        }, '  ');

        function getStringifiableSnapshot(object: any) {
            try {
                let snapshot: any = {};
                let current = object;
                let hasOwnProperty = Object.prototype.hasOwnProperty;
                do {
                    Object.keys(current).forEach(name => tryAddName(snapshot, name));
                    current = Object.getPrototypeOf(current);
                } while (current);
                return snapshot;
            } catch (e) {
                return object;
            }

            function tryAddName(snapshot: any, name: string) {
                if (name.indexOf('_') < 0 &&
                    _.has(snapshot, name)) {
                    Object.defineProperty(snapshot, name, {
                        configurable: true,
                        enumerable: true,
                        get: () => {
                            return object[name];
                        }
                    });
                }
            }
        }
    }

    static appendToArray<T>(array: T[], item: T);
    static appendToArray<T>(array: T[], items: T[]);
    static appendToArray<T>(array: T[], itemOrItems: T | T[]) {
        if (_.isArray(itemOrItems)) {
            itemOrItems.forEach((msg) => {
                array.push(msg);
            });
        } else {
            array.push(<T>itemOrItems);
        }
    }

    static isUrl(entry: string): boolean {
        entry = entry.trim().toLowerCase();
        return entry.startsWith('http://') || entry.startsWith('https://') || entry.startsWith('//');
    }

    static normalizeUrl(url: string): string {
        url = url.trim();
        if (Utilities.isUrl(url)) {
            // strip out https: or http:
            return url.substr(url.indexOf('//'));
        } else {
            throw new Error('Could not normalize URL ' + url);
        }
    }

    static guid() {
        try {
            let pad = (number: number) => {
                let hex: string = number.toString(16);
                while (hex.length < 4) {
                    hex = `0${hex}`;
                }
                return hex;
            };

            let buf: Uint16Array = new Uint16Array(8);
            let crypto = window.crypto || (window as any).msCrypto;
            window.crypto.getRandomValues(buf);
            return `${pad(buf[0])}${pad(buf[1])}-${pad(buf[2])}-${pad(buf[3])}-${pad(buf[4])}-${pad(buf[5])}${pad(buf[6])}${pad(buf[7])}`;
        }
        catch (exception) {
            // TODO: Handle failed GUID generation
        }
    }

    static isJSON(input: string) {
        let json = (!_.isString(input)) ? JSON.stringify(input) : input;

        try {
            json = JSON.parse(json);
        } catch (e) {
            return false;
        }

        if (json == null) {
            return false;
        }

        return true;
    }

    static progressiveAll<T>(
        promises: Promise<T>[],
        notify?: (completed: number, total: number, errors: number) => any
    ): Promise<{
        total: number,
        results: {
            index: number,
            result: T
        }[],
        errors: {
            index: number,
            error: any
        }[]
    }> {
        if (promises == null) {
            return Promise.reject(new Error('No promises were received')) as any;
        }
        else {
            let length = promises.length;
            let completed = 0;
            let errors = [];
            let results = [];

            let mappedPromises = promises.map((promise, index) => {
                promise
                    .then(data => {
                        results.push({
                            index: index,
                            result: data
                        });

                        ++completed;

                        if (notify == null) {
                            return;
                        }

                        notify(completed, length, errors.length);
                    })
                    .catch(error => {
                        errors.push({
                            index: index,
                            error: error
                        });

                        ++completed;

                        if (notify == null) {
                            return;
                        }

                        notify(completed, length, errors.length);
                    });
            });

            return Promise.all(mappedPromises).then(() => {
                return {
                    total: length,
                    results: results,
                    errors: errors
                };
            });
        }
    }
}

