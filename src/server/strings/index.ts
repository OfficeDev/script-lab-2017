import * as express from 'express';
import { keys, isString } from 'lodash';
import { createFakeStrings, getStrings } from './common';

import { EnglishStrings } from './english';

const languageGenerator: { [key: string]: () => ServerStrings } = {
    'en': () => new EnglishStrings(),
    '??': () => createFakeStrings(() => new EnglishStrings())
};

export function Strings(language: string): ServerStrings;
export function Strings(req: express.Request): ServerStrings;
export function Strings(param: any): ServerStrings {
    let language: string = param;
    if (!isString(param)) {
        language = getDisplayLanguage(param);
    }
    return getStrings(language, languageGenerator, () => new EnglishStrings());
}

function getDisplayLanguage(req: express.Request): string {
    try {
        return JSON.parse(req.body.data).displayLanguage;
    } catch (e) {
        return req.acceptsLanguages(keys(languageGenerator)) as string || 'en';
    }
}

export interface ServerStrings {
    error: string;
    unexpectedError: string;

    getLoadingSnippetSubtitle(snippetName: string): string;
    getSyntaxErrorsTitle(count: number): string

    getGoBackToEditor(editorUrl: string): string

    createdWithScriptLab: string;

    scriptLabRunner: string;
    versionInfo: string;

    manifestDefaults: {
        nameIfEmpty: string;
        descriptionIfEmpty: string;
    };

    runPageTitle: string;
    back: string;
    switchToSnippet: string;
    snippetCodeChanged: string;
    refresh: string;
    dismiss: string;
    editingDifferentSnippet1: string;
    editingDifferentSnippet2: string;
    loadLatestSnippet: string;
}
