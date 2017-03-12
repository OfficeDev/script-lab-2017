import { queryParamsToJson, post } from '../app/helpers';
import { Storage, StorageType } from '@microsoft/office-js-helpers';

import '../assets/styles/refresh.scss';

(() => {

    // The refresh page is meant to be as lean as possible.
    // It does not reference Office.js, nor should it try to deduce any parameters
    // (e.g., host) about itself.
    // Any information it needs should come on query parameters for efficiency's sake.

    const queryParams = queryParamsToJson(window.location.href);
    const { host, id, runnerUrl, returnUrl } = queryParams;

    if (!host || !id || !runnerUrl) {
        console.error(queryParams);
        return showError('Missing some snippet parameters.', returnUrl);
    }

    const snippets = new Storage<ISnippet>(`playground_${host}_snippets`);
    let snippet = snippets.get(id);
    if (!snippet) {
        // Check if it might be an unsaved (unmodified) last-opened snippet:
        const settings = (new Storage<ISettings>('playground_settings', StorageType.LocalStorage)).get(host);
        if (settings && settings.lastOpened && settings.lastOpened.id === id) {
            snippet = settings.lastOpened;
        }
    }

    // If still no snippet, no luck:
    if (!snippet) {
        return showError('Could not find the snippet.', returnUrl);
    }

    const data = JSON.stringify({
        snippet: snippet
    });

    post(runnerUrl + '/compile/page', { data });


    // Helpers

    function showError(text: string, returnUrl?: string): void {
        const subtitle = document.getElementById('subtitle');
        subtitle.innerHTML = text + ' ' +
            (returnUrl ? 'Returning...' : 'Please close this window and try again.');
        subtitle.style.color = 'red';

        if (returnUrl) {
            setTimeout(() => window.location.href = returnUrl, 2500);
        } else {
            document.getElementById('progress').style.display = 'none';
        }
    }

})();
