import { post } from '../app/helpers';
import { Storage, StorageType, Authenticator } from '@microsoft/office-js-helpers';
import '../assets/styles/extras.scss';

(() => {

    // The refresh page is meant to be as lean as possible.
    // It does not reference Office.js, nor should it try to deduce any parameters
    // (e.g., host) about itself.
    // Any information it needs should come on query parameters for efficiency's sake.

    const queryParams = Authenticator.getUrlParams(location.href, location.origin, '?') as any;
    const { host, id, runnerUrl, returnUrl } = queryParams;

    if (!(host && id && runnerUrl)) {
        return showError('Missing some snippet parameters.', returnUrl);
    }

    const snippets = new Storage<ISnippet>(`playground_${host}_snippets`);
    let snippet = snippets.get(id);
    if (snippet == null) {
        // Check if it might be an unsaved (unmodified) last-opened snippet:
        const settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage).get(host);
        if (settings && settings.lastOpened && settings.lastOpened.id === id) {
            snippet = settings.lastOpened;
        }
    }

    // If still no snippet, no luck:
    if (snippet == null) {
        return showError('Could not find the snippet.', returnUrl);
    }

    const data = JSON.stringify({ snippet });

    showError(data);
    (document.querySelector('#subtitle') as any).onclick = () =>
        post(runnerUrl + '/compile/page', { data });


    // Helpers
    function showError(message: string, returnUrl?: string): void {
        const subtitle = document.querySelector('#subtitle') as HTMLElement;
        const progress = document.querySelector('#progress-dots') as HTMLElement;
        const text = returnUrl ? 'Returning...' : 'Please close this window and try again.';
        subtitle.innerText = `${message} ${text}`;

        if (returnUrl) {
            setTimeout(() => window.location.replace(returnUrl), 2500);
        }
        else {
            console.error(message, queryParams);
            progress.style.display = 'none';
            subtitle.style.color = '#ff6700';
        }
    }
})();
