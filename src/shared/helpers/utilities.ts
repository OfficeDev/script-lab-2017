export enum ContextType {
    Unknown,
    Excel,
    Word,
    Fabric,
    TypeScript,
}

export class Utilities {
    static officeInitialized: boolean;
    
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
            return '';
        }
        
        return text;
    }

    static isNullOrWhitespace(text: string) {
        return Utilities.isNull(text) || Utilities.isEmpty(text.trim());
    }

    static stripSpaces(text: string) {
        let lines: string[] = text.split('\n').map(function(item) {
			return item.replace(new RegExp("\t", 'g'), "    ");
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

    static stringifyPlusPlus(object) {
        // Don't JSON.stringify strings, because we don't want quotes in the output
        if (object === null) {
            return "null";
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
        if (object.toString() !== "[object Object]") {
            return object.toString();
        }

        // Otherwise, stringify the object

        return JSON.stringify(object, (key, value) => {
            if (value && typeof value === "object" && !$.isArray(value)) {
                return getStringifiableSnapshot(value);
            }
            return value;
        }, "  ");

        function getStringifiableSnapshot(object: any) {
            try {
                var snapshot: any = {};
                var current = object;
                var hasOwnProperty = Object.prototype.hasOwnProperty;
                function tryAddName(name: string) {
                    if (name.indexOf("_") < 0 &&
                        !hasOwnProperty.call(snapshot, name)) {
                        Object.defineProperty(snapshot, name, {
                            configurable: true,
                            enumerable: true,
                            get: function () {
                                return object[name];
                            }
                        });
                    }
                }
                do {
                    Object.keys(current).forEach(tryAddName);
                    current = Object.getPrototypeOf(current);
                } while (current);
                return snapshot;
            } catch (e) {
                return object;
            }
        }
    }

    static reloadPage() {
        window.location.reload();
    }

    static getContextNamespace() {
        switch (Utilities.context) {
            case ContextType.Excel:
                return 'Excel';
            case ContextType.Word:
                return 'Word';
            default:
                throw new Error("Invalid context type for Office namespace");
        }
    }

    static get contextString(): string {
        return window.sessionStorage.getItem('context');
    }

    static get context(): ContextType {
        switch (Utilities.contextString) {
            case 'excel':
                return ContextType.Excel;
            case 'word':
                return ContextType.Word;
            case 'fabric':
                return ContextType.Fabric;
            case 'typescript':
                return ContextType.TypeScript;
            default:
                throw new Error("Unknown context");
        }
    }

    static get contextTagline(): string {
        switch (Utilities.context) {
            case ContextType.Excel:
            case ContextType.Word:
                return 'Office Add-in Playground';

            case ContextType.Fabric:
                return 'Fabric Playground';

            case ContextType.TypeScript:
                return 'TypeScript Playground';

            default: 
                throw new Error("Cannot determine playground context");
        }
    }

    static get fullPlaygroundDescription(): string {
        switch (Utilities.context) {
            case ContextType.Excel:
            case ContextType.Word:
                return "Office Add-in Playground - " + Utilities.captializeFirstLetter(Utilities.contextString);

            case ContextType.Fabric:
                return "Fabric Playground";

            case ContextType.TypeScript:
                return "TypeScript Playground";

            default:
                throw "Invalid context " + Utilities.context;
        }
    }

    static captializeFirstLetter(input: string): string {
        return input.substr(0, 1).toUpperCase() + input.substr(1);
    }

    static randomize = (limit = 100000, start = 0) => Math.floor(Math.random() * limit + start);
}