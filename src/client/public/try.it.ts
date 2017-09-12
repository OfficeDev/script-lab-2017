import * as $ from 'jquery';
import * as OfficeJsHelpers from '@microsoft/office-js-helpers';
import { InformationalError } from '../app/helpers';
import '../assets/styles/extras.scss';

interface InitializationParams {
    origin: string;
    runnerSnippetUrl: string;
    wacUrl: string;
}

const WAC_URL_STORAGE_KEY = 'playground_wac_url';

(() => {
    (window as any).in_try_it_mode = true;
    let params: InitializationParams;
    let snippetId;

    (window as any).initializeTryIt = (receivedParams: InitializationParams): void => {
        params = receivedParams;

        window.addEventListener('message', receiveMessage, false);
        $(document).ready(() => tryCatch(() => initializeTryItHelper()));

        function receiveMessage(event) {
            if (event.origin !== params.origin) {
                return;
            }

            snippetId = event.data.id;
        }
    };

    async function initializeTryItHelper() {
        if (params.wacUrl) {
            window.localStorage.setItem(WAC_URL_STORAGE_KEY, params.wacUrl);
        }

        let url = window.localStorage[WAC_URL_STORAGE_KEY];
        if (!url) {
            throw new InformationalError(
                'Error: missing Office Online reference',
                `Until we can have a production Office Online server working with the "Try it live" feature, ` +
                `you'll need to bootstrap the experience once by providing a "wacURL" parameter. ` +
                `Please see the docs demo page for the URL, click on it once (in the browser that you want to use the "Try it live" feature in), ` +
                ` and then refresh this page.`);
        }

        let session = new (OfficeExtension as any).EmbeddedSession(url, { id: 'embed-frame', container: document.getElementById('panel-bottom') });
        await session.init();

        $('.runner-frame').remove();
        $('.panel.right').append(`<iframe class="runner-frame" id="runner-frame" src="${params.runnerSnippetUrl}${snippetId}"></iframe>`);

        (OfficeExtension.ClientRequestContext as any)._overrideSession = session;
    };

    async function tryCatch(callback) {
        try {
            await callback();
        }
        catch (error) {
            $('body').empty();
            OfficeJsHelpers.UI.notify(error);
            OfficeJsHelpers.Utilities.log(error);
        }
    }
})();
