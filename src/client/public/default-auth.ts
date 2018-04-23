import { Authenticator } from '@microsoft/office-js-helpers';

import '../assets/styles/extras.scss';


(async () => {
    let authRequestParams: DefaultAuthRequestParamData = Authenticator.extractParams(window.location.href.split('?')[1]) || {};

    document.getElementById('cancel').onclick = () => { window.close(); };

    // TODO
    // storage.snippets.load();
    // let snippet = storage.snippets.get(authRequestParams.snippet_id);
    // if (!snippet) {
    //     document.getElementById('snippetId').textContent = 'Snippet not found!';
    //     (document.getElementById('authorize') as HTMLButtonElement).disabled = true;
    //     showPage();
    //     return;
    // }
    // document.getElementById('snippetId').textContent = `Snippet: ${snippet.name}`;

    let localStorageKey = `consent_${authRequestParams.snippet_id}`;
    if (localStorage.getItem(localStorageKey)) {
        window.location.assign(authRequestParams.auth_url);
    } else {
        document.getElementById('authorize').onclick = () => {
            localStorage.setItem(localStorageKey, 'true');
            window.location.assign(authRequestParams.auth_url);
        };
        showPage();
    }

    function showPage() {
        document.getElementById('main').style.display = 'block';
    }
})();
