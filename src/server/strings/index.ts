import * as express from 'express';
import { keys, isString } from 'lodash';
import { createFakeStrings, getStrings } from './common';


////////////////////////////////////////////////////////////////////////////
//// To add a new language, just fill in this section and also create   ////
//// a corresponding language file modeled after the English one.       ////
//// Note that you will also need separate strings for CLIENT vs SERVER ////
////////////////////////////////////////////////////////////////////////////

import { getEnglishStrings } from './english';
import { getGermanStrings } from './german';
import { getSpanishStrings } from './spanish';

const languageGenerator: { [key: string]: () => ServerStrings } = {
    'en': () => getEnglishStrings(),
    'de': () => getGermanStrings(),
    'es': () => getSpanishStrings(),
    '??': () => createFakeStrings(() => getEnglishStrings())
};

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////


export function Strings(language: string): ServerStrings;
export function Strings(req: express.Request): ServerStrings;
export function Strings(param: any): ServerStrings {
    let language: string = param;
    if (!isString(param)) {
        language = getDisplayLanguage(param);
    }
    return getStrings(language, languageGenerator, () => getEnglishStrings());
}

export function getExplicitlySetDisplayLanguageOrNull(req: express.Request): string {
    const requestBodyLanguage = getRequestBodyLanguage();
    if (requestBodyLanguage) {
        return requestBodyLanguage;
    }

    if (req.cookies && req.cookies['displayLanguage']) {
        return req.cookies['displayLanguage'];
    }

    return null;


    function getRequestBodyLanguage() {
        try {
            return JSON.parse(req.body.data).displayLanguage;
        } catch (e) {
            return null;
        }
    }
}

function getDisplayLanguage(req: express.Request): string {
    return getExplicitlySetDisplayLanguageOrNull(req) ||
        req.acceptsLanguages(keys(languageGenerator)) as string ||
        'en';
}

export interface ServerStrings {
    error: string;
    unexpectedError: string;
    invalidHost: string;
    invalidId: string;
    receivedInvalidAuthCode: string;
    failedToAuthenticateUser: string;
    receivedInvalidSnippetData: string;
    unrecognizedScriptLanguage: string;
    line: string;

    getLoadingSnippetSubtitle(snippetName: string): string;
    loadingSnippetDotDotDot: string;
    getSyntaxErrorsTitle(count: number): string

    getGoBackToEditor(editorUrl: string): string

    createdWithScriptLab: string;

    scriptLabRunner: string;
    versionInfo: string;

    manifestDefaults: {
        nameIfEmpty: string;
        descriptionIfEmpty: string;
    };

    run: string;
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
