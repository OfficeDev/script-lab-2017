export class Utilities {
    static stringOrEmpty(text: string): string {
        if (text === null || text === undefined) {
            return '';
        }

        return text;
    }

    static isNullOrWhitespace(text: string) {
        return text == null || text.trim().length == 0;
    }

    static stripSpaces(text: string) {
        let lines: string[] = Utilities.stringOrEmpty(text).split('\n').map(function (item) {
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

    static replaceAllTabsWithSpaces(data: string): string {
        return data.replace(new RegExp('\t', 'g'), '    ');
    }

    static randomize = (limit = 100000, start = 0) => Math.floor(Math.random() * limit + start);
}