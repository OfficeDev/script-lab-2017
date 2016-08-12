export enum ContextType {
    Web,
    Word,
    Excel
}

export class Utilities {
    private static _context: ContextType = null;

    static encode(name: string) {
        if (this.isEmpty(name)) return null;
        return encodeURIComponent(btoa(name));
    }

    static decode(encodedString: string): string {
        if (this.isEmpty(encodedString)) return null;
        return atob(decodeURIComponent(encodedString));
    }

    static replace(source: string): (key: string, value: string) => any {
        return function self(key: string, value: string): any {
            if (!key) return source;
            source = source.replace(key, value);
            return self;
        };
    }

    static regex(source: string): (key: RegExp, value: string) => any {
        return function self(key: RegExp, value: string): any {
            if (!key) return source;
            source = source.replace(key, value);
            return self;
        };
    }

    static isNull(obj: any): boolean {
        return _.isUndefined(obj) || _.isNull(obj);
    }

    static isEmpty(obj: any): boolean {
        return this.isNull(obj) || _.isEmpty(obj);
    }

    static stringOrEmpty(text: string): string {
        if (text === null || text === undefined) {
            return "";
        }
        
        return text;
    }

    static isNullOrWhitespace(text: string) {
        return (text === null || text === undefined || text.trim().length === 0);
    }

    static stripSpaces(text: string) {
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
        } while (isZeroLengthLine || (arrayPosition === lines.length))

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
        } while (isZeroLengthLine)

        // Get smallest indent for align left.
        var shortestIndentSize: number = 1024;
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
        var finalSetOfLines: string = '';
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
        var lines: string[] = text.split('\n');
        var indentString = "";
        for (var i = 0; i < indentSize; i++) {
            indentString += "    ";
        }

        return lines.map((line) => indentString + line).join('\n');
    }

    static get isExcel() {
        return this._context == ContextType.Excel;
    }

    static get isWord() {
        return this._context == ContextType.Word;
    }

    static get isWeb() {
        return this._context == ContextType.Web;
    }

    static error<T>(exception?: any): any {
        console.log('Error: ' + JSON.stringify(exception));

        return exception;
    }

    static get context(): ContextType {
        if (this.isNull(this._context)) {
            if (_.has(window, 'Word')) {
                this._context = ContextType.Word;
            }
            else if (_.has(window, 'Excel')) {
                this._context = ContextType.Excel;
            }
            else {
                this._context = ContextType.Web;
            };
        }
        return this._context;
    }
}