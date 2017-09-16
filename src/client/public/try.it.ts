import * as $ from 'jquery';
import * as OfficeJsHelpers from '@microsoft/office-js-helpers';
import { environment, InformationalError } from '../app/helpers';

import '../assets/styles/extras.scss';

interface InitializationParams {
    host: string;
    origin: string;
    runnerSnippetUrl: string;
    wacUrl: string;
}

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
        await environment.initialize(params.host);

        if (!environment.current.wacUrl) {
            throw new InformationalError(
                'Error: missing Office Online reference',
                `Until we can have a production Office Online server working with the "Try it live" feature, ` +
                `you'll need to bootstrap the experience once by providing a "wacURL" parameter. ` +
                `Please see the docs demo page for the URL, click on it once (in the browser that you want to use the "Try it live" feature in), ` +
                ` and then refresh this page.`);
        }

        let session = new (OfficeExtension as any).EmbeddedSession(
            environment.current.wacUrl,
            { id: 'embed-frame', container: document.getElementById('panel-bottom') }
        );

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
