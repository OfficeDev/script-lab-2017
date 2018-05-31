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
import { getChineseSimplifiedStrings } from './chinese-simplified';

const languageGenerator: { [key: string]: () => ServerStrings } = {
  en: () => getEnglishStrings(),
  de: () => getGermanStrings(),
  es: () => getSpanishStrings(),
  'zh-cn': () => getChineseSimplifiedStrings(),
  '??': () => createFakeStrings(() => getEnglishStrings()),
};

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

/** Function for use in non-English files, acting as a marker for text that still needs to be translated.
 * We are not using "getEnglishStrings()" directly to avoid an extra import in the other files,
 * and so that it's semantically clear that there are missing translations left.
 */
export function getEnglishSubstitutesForNotYetTranslated() {
  return getEnglishStrings();
}

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
  return (
    getExplicitlySetDisplayLanguageOrNull(req) ||
    (req.acceptsLanguages(keys(languageGenerator)) as string) ||
    'en'
  );
}
