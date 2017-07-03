import { environment } from '../helpers';
import { createFakeStrings, getStrings } from './common';
const LANGUAGE_LOCALSTORAGE_KEY = 'playground_language';


//////////////////////////////////////////////////////////
//// To add a new language, just fill in this section ////
//// and also create a corresponding language file    ////
//// modeled after the English one.                   ////
//////////////////////////////////////////////////////////

import { EnglishStrings } from './english';

let availableLanguages = [
    { name: 'English', value: 'en' }
];

const languageGenerator: { [key: string]: () => ClientStrings } = {
    'en': () => new EnglishStrings(),
    '??': () => createFakeStrings(() => new EnglishStrings())
};


//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////


export function getAvailableLanguages(): { name: string, value: string }[] {
    let langs = availableLanguages.slice();
    if (environment.current.devMode) {
        langs.push({ name: 'Fake Strings', value: '??' });
    }
    return langs;
}

export function Strings(): ClientStrings {
    return getStrings(getRawDisplayLanguage(), languageGenerator, () => new EnglishStrings());
}

export function getDisplayLanguage() {
    return (getRawDisplayLanguage() || 'en').toLowerCase().substr(0, 2);
}

export function setDisplayLanguage(language) {
    window.localStorage[LANGUAGE_LOCALSTORAGE_KEY] = language;
}

function getRawDisplayLanguage() {
    if (!window.localStorage) {
        return null;
    }

    if (window.localStorage[LANGUAGE_LOCALSTORAGE_KEY]) {
        return window.localStorage[LANGUAGE_LOCALSTORAGE_KEY];
    }

    if (Office && Office.context && Office.context.displayLanguage) {
        return Office.context.displayLanguage;
    }

    if (window.navigator && window.navigator.language) {
        return window.navigator.language;
    }

    return null;
}

export interface ClientStrings {
    playgroundName: string;
    playgroundTagline: string;

    userId: string;

    run: string;
    runInThisPane: string;
    runSideBySide: string;
    share: string;
    delete: string;
    close: string;
    about: string;
    feedback: string;

    okButtonLabel: string;
    logoutButtonLabel: string;
    cancelButtonLabel: string;
    saveButtonLabel: string;
    moreInfoButtonLabel: string;
    importButtonLabel: string;

    snippetImportError: string;
    snippetImportErrorTitle: string;
    snippetImportErrorBody: string;
    reloadPrompt: string;

    snippetSaveError: string;
    snippetDupeError: string;
    snippetDeleteError: string;
    snippetDeleteAllError: string;
    snippetLoadAllError: string;
    snippetRunError: string;
    snippetLoadDefaultsError: string;

    snippetUpdateError: string;

    snippetValidationEmpty: string;
    snippetValidationNoTitle: string;

    defaultSnippetTitle: string;
    newSnippetTitle: string;

    //ui.ts strings:
    dialogError: string;
    dialogOpenError: string;

    //monaco.ts strings:
    intellisenseUpdateError: string;
    intellisenseClearError: string;
    intellisenseLoadError: string;

    //github.ts strings:
    githubLoginFailed: string;
    githubLogoutFailed: string;
    profileCheckFailed: string;
    gistRetrieveFailed: string;
    gistDescriptionAppendage: string;

    gistShareFailedBody: string;
    gistShareFailedTitle: string;

    gistSharedDialogStart: string;
    gistSharedDialogEnd: string;
    gistSharedDialogTitle: string;
    gistSharedDialogViewButton: string;

    snippetCopiedConfirmation: string;
    snippetCopiedFailed: string;

    snippetExportFailed: string;

    // Components strings
    // about.ts
    aboutUpdated: string;
    aboutStorage: string;
    aboutSnippets: string;
    aboutIntellisense: string;

    //snippet.info.ts
    nameLabel: string;
    descriptionLabel: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;

    // Containers strings
    //app.ts

    shareMenuPublic: string;
    shareMenuPrivate: string;
    updateMenu: string;

    shareMenuClipboard: string;
    shareMenuExport: string;

    loginGithub: string;

    lightTheme: string;
    darkTheme: string;

    deleteSnippetConfirm: string;

    tabDisplayNames: {
        'script': string;
        'template': string;
        'style': string;
        'libraries': string;
    },

    // Gallery.view strings

    snippetsTab: string;
    samplesTab: string;

    noSnippetsMessage: string;
    noGistsMessage: string;

    newSnippetDescription: string;
    importDescription: string;

    // import.ts strings

    newSnippetLabel: string;
    mySnippetsLabel: string;
    samplesLabel: string;
    importLabel: string;
    mySnippetsDescription: string;
    localSnippetsLabel: string;
    noLocalSnippets: string;
    sharedGistsLabel: string;
    sharedGistsSignIn: string;
    samplesDescription: string;
    noSamplesMessage: string;
    importWarning: string;
    importWarningAction: string;

    localStorageWarning: string;
    localStorageWarningAction: string;

    importInstructions: string;
    importUrlLabel: string;
    importUrlPlaceholder: string;
    importYamlLabel: string;

    Refresh: {
        /** Error if refresh URL is somehow misformed (should essentially never happen) */
        missingSnippetParameters: string;

        /** Error if snippet no longer exists */
        couldNotFindTheSnippet: string;

        /** Appends one of the following -- "returning" or "close this window and try again" -- to the error message
         * (navigating back after a couple of seconds, if there is a return URL) */
        getTextToAppendToErrorMessage: (returnUrl: string) => string;
    };

    Runner: {
        snippetNoLongerExists: string;
        unexpectedError: string;

        reloadingOfficeJs: string;

        noSnippetIsCurrentlyOpened: string;

        getLoadingSnippetSubtitle(snippetName?: string): string;
    };

    /** Error strings served by the server and displayed in the Error page */
    ServerError: {
        moreDetails: string;
        hideDetails: string;
    };

    SideBySideInstructions: {
        title: string;

        /** Message about where to find the "run" button in the ribbon, and why side-by-side is better */
        message: string;

        gotIt: string;
    };

    IndexPageStrings: {
        localStorageUnavailableMessage: string;
        chooseYourHost: string;
    };
}
