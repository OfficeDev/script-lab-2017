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
