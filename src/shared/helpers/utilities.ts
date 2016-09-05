import {Http} from '@angular/http';

export class Utilities {   
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

        if (_.isString(text)) {
            return text;
        }
        
        return text.toString();
    }

    static isNullOrWhitespace(text: string) {
        return Utilities.isNull(text) || Utilities.isEmpty(text.trim());
    }

    static stripSpaces(text: string) {
        let lines: string[] = Utilities.stringOrEmpty(text).split('\n').map(function(item) {
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
        var lines: string[] = Utilities.stringOrEmpty(text).split('\n');
        var indentString = "";
        for (var i = 0; i < indentSize; i++) {
            indentString += "    ";
        }

        return lines.map((line) => indentString + line).join('\n');
    }

    static stringifyPlusPlus(object): string {
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

    static appendToArray<T>(array: T[], item: T);
    static appendToArray<T>(array: T[], items: T[]);
    static appendToArray<T>(array: T[], itemOrItems: T|T[]) {
        if (_.isArray(itemOrItems)) {
            itemOrItems.forEach((msg) => {
                array.push(msg);
            })
        } else {
            array.push(itemOrItems);
        }
    }

    static isUrl(entry: string): boolean {
        entry = entry.trim().toLowerCase();
        return entry.startsWith("http://") || entry.startsWith("https://") || entry.startsWith("//");
    }
    
    static normalizeUrl(url: string): string {
        url = url.trim();
        if (Utilities.isUrl(url)) {
            // strip out https: or http:
            return url.substr(url.indexOf("//"));
        } else {
            throw new Error("Could not normalize URL " + url);
        }
    }

    static randomize = (limit = 100000, start = 0) => Math.floor(Math.random() * limit + start);

    static reloadPage() {
        window.location.reload();
    }

    static get playgroundBasePath(): string {
        return window.location.protocol + "//" + window.location.hostname + 
            (window.location.port ? (":" + window.location.port) : "") + window.location.pathname;
    }

    static isJson(input: string) {
        try {
            JSON.parse(input);
        } catch (e) {
            return false;
        }
        
        return true;
    }

    static fetchEnvironmentConfig(http: Http) {
         var envConfigJsonUrl = Utilities.playgroundBasePath + 'env.json' + '?rand=' + new Date().getTime();
        
        return http.get(envConfigJsonUrl)
            .toPromise()
            .then(response => response.json())
            .catch((e) => {
                throw new Error('Could not retrieve the environment configuration');
            });
    }
}