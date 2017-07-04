/// NOTE: This file is an identical shared between Server and Client
///       If you make any changes, please make it to both copies!


import { forIn, isString, isFunction } from 'lodash';

const languageCache: { [key: string]: any } = {};

export function createFakeStrings<T>(generator: () => T): T {
    let generated = generator();
    substituteWithReverse(generated);
    return generated;
}

export function getStrings<T>(
    language: string,
    languageGenerator: { [key: string]: () => T },
    defaultLanguageGenerator: () => T
): T {
    language = (language || 'en').toLowerCase().substr(0, 2);

    if (languageCache[language]) {
        return languageCache[language];
    }

    languageCache[language] = languageGenerator[language] ?
        languageGenerator[language]() : defaultLanguageGenerator();

    // Having done the switch statement above, language cache is now guaranteed to contain the language:
    return languageCache[language];
}

function substituteWithReverse(obj: {[key: string]: string | any}) {
    forIn(obj, (value, key) => {
        if (isString(value)) {
            obj[key] = reverseAndLowercase(value);
        } else if (isFunction(value)) {
            obj[key] = /* tslint:disable */ function() { /* tslint:enable */
                let text: string = (value as Function)(arguments);
                return reverseAndLowercase(text);
            };
        } else {
            substituteWithReverse(value);
        }
    });

    function reverseAndLowercase(text: string): string {
        return text.split('').reverse().join('').toLowerCase();
    }
}
