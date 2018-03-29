import { storage, ensureFreshLocalStorage } from '../helpers';
const { localStorageKeys } = PLAYGROUND;

class TrustedSnippetManager {
    cleanUpTrustedSnippets(): void {
        try {
            ensureFreshLocalStorage();
            let trustedSnippets = JSON.parse(window.localStorage.getItem(localStorageKeys.trustedSnippets)) || {};
            for (let snippetId of Object.keys(trustedSnippets)) {
                if (!storage.snippets.get(snippetId)) {
                    delete trustedSnippets[snippetId];
                }
            }
            window.localStorage.setItem(localStorageKeys.trustedSnippets, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }

    isSnippetTrusted(snippetId: string, gistId: string, gistOwnerId: string): boolean {
        /* Samples or locally-created snippets are automatically trusted.
           I's only the Gists that you need to watch out for. */
        if (!gistId) {
            return true;
        }

        if (storage.current.profile && storage.current.profile.login) {
            if (storage.current.profile.login === gistOwnerId) {
                return true;
            }
        }

        try {
            ensureFreshLocalStorage();
            const trustedSnippets = JSON.parse(window.localStorage.getItem(localStorageKeys.trustedSnippets)) || {};
            return trustedSnippets[snippetId] ? true : false;
        } catch (e) {
            return false;
        }
    }

    trustSnippet(snippetId: string): void {
        try {
            ensureFreshLocalStorage();
            const trustedSnippets = JSON.parse(window.localStorage.getItem(localStorageKeys.trustedSnippets)) || {};
            trustedSnippets[snippetId] = true;
            window.localStorage.setItem(localStorageKeys.trustedSnippets, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }

    untrustSnippet(snippetId: string): void {
        try {
            ensureFreshLocalStorage();
            const trustedSnippets = JSON.parse(window.localStorage.getItem(localStorageKeys.trustedSnippets)) || {};
            delete trustedSnippets[snippetId];
            window.localStorage.setItem(localStorageKeys.trustedSnippets, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }
}

export const trustedSnippetManager = new TrustedSnippetManager();
