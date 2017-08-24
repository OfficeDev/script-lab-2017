class TrustedSnippet {
    private _trustedSnippetsKey = 'trusted_snippets';

    isSnippetTrusted(snippetId: string, gistId: string): boolean {
        let trustedSnippets = JSON.parse(window.localStorage.getItem(this._trustedSnippetsKey));
        if (!trustedSnippets) {
            trustedSnippets = {};
        }
        /* Samples are automatically trusted. Check local storage for gists. */
        if (!gistId || trustedSnippets[snippetId]) {
            return true;
        }
        return false;
    }

    updateTrustedSnippets(snippetId: string): void {
        let trustedSnippets = JSON.parse(window.localStorage.getItem(this._trustedSnippetsKey));
        if (!trustedSnippets) {
            trustedSnippets = {};
        }
        trustedSnippets[snippetId] = true;
        window.localStorage.setItem(this._trustedSnippetsKey, JSON.stringify(trustedSnippets));
    }
}

export const trustedSnippet = new TrustedSnippet();
