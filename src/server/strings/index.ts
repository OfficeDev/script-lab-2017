import * as express from 'express';
import { keys } from 'lodash';
import { createFakeStrings, getStrings } from './common';

import { EnglishStrings } from './english';

const languageGenerator: { [key: string]: () => ServerStrings } = {
    'en': () => new EnglishStrings(),
    '??': () => createFakeStrings(() => new EnglishStrings())
};

export function Strings(language: string): ServerStrings {
    return getStrings(language, languageGenerator, () => new EnglishStrings());
}

export function getDisplayLanguage(req: express.Request): string {
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

    manifestDefaults: {
        nameIfEmpty: string;
        descriptionIfEmpty: string;
    };
}
