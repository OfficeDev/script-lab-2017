export function stringOrEmpty(text: string): string {
    if (text === null || text === undefined) {
        return '';
    }

    return text;
}

export function indentAll(text: string, indentSize: number) {
    let lines: string[] = stringOrEmpty(text).split('\n');
    let indentString = '';
    for (let i = 0; i < indentSize; i++) {
        indentString += '    ';
    }

    return lines.map((line) => indentString + line).join('\n');
}

export function generateUrl(base: string, queryParams: any) {
    const result = [];
    for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
            result.push(`${key}=${encodeURIComponent(queryParams[key])}`);
        }
    }

    if (result.length === 0) {
        return base;
    }

    return `${base}?${result.join('&')}`;
}

export function replaceTabsWithSpaces(data: string): string {
    return data.replace(new RegExp('\t', 'g'), '    ');
}

export function processLibraries(snippet: ISnippet) {
    let linkReferences = [];
    let scriptReferences = [];
    let officeJS: string = null;

    snippet.libraries.split('\n').forEach(processLibrary);

    return { linkReferences, scriptReferences, officeJS };


    function processLibrary(text: string) {
        if (text == null || text.trim() === '') {
            return null;
        }

        text = text.trim();

        let isNotScriptOrStyle =
            /^#.*|^\/\/.*|^\/\*.*|.*\*\/$.*/im.test(text) ||
            /^@types/.test(text) ||
            /^dt~/.test(text) ||
            /\.d\.ts$/i.test(text);

        if (isNotScriptOrStyle) {
            return null;
        }

        let resolvedUrlPath = (/^https?:\/\/|^ftp? :\/\//i.test(text)) ? text : `https://unpkg.com/${text}`;

        if (/\.css$/i.test(resolvedUrlPath)) {
            return linkReferences.push(resolvedUrlPath);
        }

        if (/\.ts$|\.js$/i.test(resolvedUrlPath)) {
            /*
            * Don't add Office.js to the rest of the script references --
            * it is special because of how it needs to be *outside* of the iframe,
            * whereas the rest of the script references need to be inside the iframe.
            */
            if (/(?:office|office.debug).js$/.test(resolvedUrlPath.toLowerCase())) {
                officeJS = resolvedUrlPath;
                return null;
            }

            return scriptReferences.push(resolvedUrlPath);
        }

        return scriptReferences.push(resolvedUrlPath);
    }
}
