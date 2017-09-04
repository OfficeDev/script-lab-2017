import { environment } from '../helpers';
import { createFakeStrings, getStrings } from './common';
import { importUrlPlaceholder } from './language-agnostic';

/** Localstorage key for playground language. Will get set both on the client domain
  * (as expected), and also on the runner domain (due to its use in runner.ts) */
const LANGUAGE_LOCALSTORAGE_KEY = 'playground_language';

////////////////////////////////////////////////////////////////////////////
//// To add a new language, just fill in this section and also create   ////
//// a corresponding language file modeled after the English one.       ////
//// Note that you will also need separate strings for CLIENT vs SERVER ////
////////////////////////////////////////////////////////////////////////////

import { getEnglishStrings } from './english';
import { getGermanStrings } from './german';
import { getSpanishStrings } from './spanish';
import { getChineseSimplifiedStrings } from './chinese-simplified';

let availableLanguages = [
    { name: 'English', value: 'en' },
    { name: 'Deutsch', value: 'de' },
    { name: 'Español', value: 'es' },
    { name: '中文', value: 'zh-cn' }
];

const languageGenerator: { [key: string]: () => ClientStringsPerLanguage } = {
    'en': () => getEnglishStrings(),
    'de': () => getGermanStrings(),
    'es': () => getSpanishStrings(),
    'zh-cn': () => getChineseSimplifiedStrings(),
    '??': () => createFakeStrings(() => getEnglishStrings())
};

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

export function getAvailableLanguages(): { name: string, value: string }[] {
    let langs = availableLanguages.slice();
    if (environment.current.devMode) {
        langs.push({ name: 'Fake Strings', value: '??' });
    }
    return langs;
}

export function Strings(): ClientStrings {
    let strings = getStrings(getRawDisplayLanguage(), languageGenerator, () => getEnglishStrings());
    return {
        ...strings,
        importUrlPlaceholder: importUrlPlaceholder(strings.exampleAbbreviation)
    };
}

export function getDisplayLanguage() {
    const rawDisplayLanguage = (getRawDisplayLanguage() || 'en-us').toLowerCase();
    for (let language of availableLanguages) {
        if (rawDisplayLanguage === language.value) {
            return rawDisplayLanguage;
        }
    }

    return rawDisplayLanguage.substr(0, 2);
}

export function getDisplayLanguageOrFake() {
    const displayLang = getDisplayLanguage();

    if (displayLang === '??') {
        // If localstorage is already set to the fake locale, return a different language
        // (e.g., Russian), just to see that it's not English strings anymore
        return 'ru';
    }

    return displayLang;
}

export function setDisplayLanguage(language) {
    window.localStorage[LANGUAGE_LOCALSTORAGE_KEY] = language;
}

/** Function for use in non-English files, acting as a marker for text that still needs to be translated.
 * We are not using "getEnglishStrings()" directly to avoid an extra import in the other files,
 * and so that it's semantically clear that there are missing translations left.
 */
export function getEnglishSubstitutesForNotYetTranslated() {
    return getEnglishStrings();
}

function getRawDisplayLanguage() {
    if (!window.localStorage) {
        return null;
    }

    if (window.localStorage[LANGUAGE_LOCALSTORAGE_KEY]) {
        return window.localStorage[LANGUAGE_LOCALSTORAGE_KEY];
    }

    const Office = (window as any).Office;
    if (Office && Office.context && Office.context.displayLanguage) {
        return Office.context.displayLanguage;
    }

    if (window.navigator && window.navigator.language) {
        return window.navigator.language;
    }

    return null;
}
