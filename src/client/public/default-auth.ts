import { Authenticator } from '@microsoft/office-js-helpers';

import '../assets/styles/extras.scss';

(async () => {
    let authRequestParams: DefaultAuthRequestParamData = Authenticator.extractParams(window.location.href.split('?')[1]) || {};

    const proceed = window.confirm("Are you liking to consent to snippet id " + authRequestParams.snippet_id + "?");

    if (proceed) {
        window.location.assign(authRequestParams.auth_url);
    }
})();
