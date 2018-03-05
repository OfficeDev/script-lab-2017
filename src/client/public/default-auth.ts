import { Authenticator } from '@microsoft/office-js-helpers';

import '../assets/styles/extras.scss';

(async () => {
    let authRequestParams: DefaultAuthRequestParamData = Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    document.getElementById('snippetId').textContent = `Snippet ID: ${authRequestParams.snippet_id}`;
    let localStorageKey = `consent_${authRequestParams.snippet_id}`;
    if (localStorage.getItem(localStorageKey) === 'true') {
        window.location.assign(authRequestParams.auth_url);
    } else {

        document.getElementById('authorize').onclick = () => {
            localStorage.setItem(localStorageKey, 'true');
            window.location.assign(authRequestParams.auth_url);
        };
        document.getElementById('cancel').onclick = () => {window.close(); };
    }
})();
