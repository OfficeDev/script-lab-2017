class TrustedSnippet {
    private _trustedSnippetsKey = 'trusted_snippets';

    isSnippetTrusted(snippetId: string, gistId: string): boolean {
        /* Samples are automatically trusted. Check local storage for gists. */
        if (!gistId) {
            return true;
        }

        try {
            let trustedSnippets = JSON.parse(window.localStorage.getItem(this._trustedSnippetsKey));
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
            let trustedSnippets = JSON.parse(window.localStorage.getItem(this._trustedSnippetsKey));
            if (!trustedSnippets) {
                trustedSnippets = {};
            }
            trustedSnippets[snippetId] = true;
            window.localStorage.setItem(this._trustedSnippetsKey, JSON.stringify(trustedSnippets));
        } catch (e) { }
    }
}

export const trustedSnippetManager = new TrustedSnippet();
