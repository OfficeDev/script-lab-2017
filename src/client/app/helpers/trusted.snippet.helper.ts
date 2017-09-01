import { storage } from '../helpers';
const TRUSTED_SNIPPETS_KEY = 'playground_trusted_snippets';

class TrustedSnippet {
    cleanUpTrustedSnippets(): void {
        try {
            let trustedSnippets = JSON.parse(window.localStorage.getItem(TRUSTED_SNIPPETS_KEY));
            for (let snippetId of Object.keys(trustedSnippets)) {
                if (!storage.snippets.get(snippetId)) {
                    delete trustedSnippets[snippetId];
                }
            }
            window.localStorage.setItem(TRUSTED_SNIPPETS_KEY, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }

    isSnippetTrusted(snippetId: string, gistId: string): boolean {
        /* Samples are automatically trusted. Check local storage for gists. */
        if (!gistId) {
            return true;
        }

        try {
            let trustedSnippets = JSON.parse(window.localStorage.getItem(TRUSTED_SNIPPETS_KEY));
            if (!trustedSnippets) {
                trustedSnippets = {};
            }
            return trustedSnippets[snippetId] ? true : false;
        } catch (e) {
            return false;
        }
    }

    updateTrustedSnippets(snippetId: string): void {
        try {
            let trustedSnippets = JSON.parse(window.localStorage.getItem(TRUSTED_SNIPPETS_KEY));
            if (!trustedSnippets) {
                trustedSnippets = {};
            }
            trustedSnippets[snippetId] = true;
            window.localStorage.setItem(TRUSTED_SNIPPETS_KEY, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }
}

export const trustedSnippetManager = new TrustedSnippet();
