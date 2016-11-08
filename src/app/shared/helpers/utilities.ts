import * as _ from 'lodash';
export enum ContextTypes {
    Web,
    Word,
    Excel,
    PowerPoint,
    OneNote
}

export class Utilities {
    static _context: ContextTypes;

    static get context(): ContextTypes {
        if (Utilities._context == null) {
            let context: ContextTypes = ContextTypes.Web;

            try {
                if (Office.context.requirements.isSetSupported('ExcelApi')) {
                    context = ContextTypes.Excel;
                } else if (Office.context.requirements.isSetSupported('WordApi')) {
                    context = ContextTypes.Word;
                } else if (Office.context.requirements.isSetSupported('OneNoteApi')) {
                    context = ContextTypes.OneNote;
                } else if (Office.context.requirements.isSetSupported('ActiveView')) {
                    context = ContextTypes.PowerPoint;
                } else if (Office.context.requirements.isSetSupported('OoxmlCoercion')) {
                    context = ContextTypes.Word;
                }
            }
            catch (exception) {
                //TODO: log exception
            }

            Utilities._context = context;
        }

        return Utilities._context;
    }

    static isEmpty(obj: any): boolean {
        return !(obj == null) || _.isEmpty(obj);
    }

    static stripSpaces(text: string): string {
        if (Utilities.isEmpty(text)) {
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
        if (Utilities.isEmpty(text)) {
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

    static reloadPage() {
        window.location.reload();
    }

    static get playgroundBasePath(): string {
        return window.location.protocol + '//' + window.location.hostname +
            (window.location.port ? (':' + window.location.port) : '') + window.location.pathname;
    }

    static isJSON(input: string) {
        try {
            JSON.parse(input);
        } catch (e) {
            return false;
        }

        return true;
    }
}
