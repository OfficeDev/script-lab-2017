import { isString, isUndefined } from 'lodash';

export function stringOrEmpty(text: string): string {
    if (text === null || text === undefined) {
        return '';
    }

    return text;
}

export function indentAll(text: string, indentSize: number, startingAtLine = 0) {
    let lines: string[] = stringOrEmpty(text).split('\n');
    let indentString = '';
    for (let i = 0; i < indentSize; i++) {
        indentString += '    ';
    }

    return lines.map((line, index) => {
        return ((index >= startingAtLine) ? indentString : '') + line;
    }).join('\n');
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

export function clipText(text: string, max: number) {
    if (isUndefined(text)) {
        text = '';
    } else if (!isString(text)) {
        throw new Error('Invalid argument: clipText expected string parameter');
    }

    if (text.length < (max - 3)) {
        return text;
    }

    return text.substr(0, max - 3) + '...';
}
