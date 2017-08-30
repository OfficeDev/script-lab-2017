import * as $ from 'jquery';
import '../assets/styles/extras.scss';

interface InitializationParams {
    origin: string;
    runnerSnippetUrl: string;
    wacUrl: string;
}

(() => {
    (window as any).in_try_it_mode = true;
    (window as any).initializeTryIt = initializeTryIt;
    let snippetId;

    function initializeTryIt(params: InitializationParams): void {
        $(document).ready(() => {
            window.addEventListener('message', receiveMessage, false);
            let url = params.wacUrl;
            let session = new (OfficeExtension as any).EmbeddedSession(url, { id: 'embed-frame', sessionKey: '1', container: document.getElementById('panel-bottom') });
            session.init().then(() => {
                $('.runner-frame').remove();
                $('.panel.right').append(`<iframe class="runner-frame" id="runner-frame" src="${params.runnerSnippetUrl}${snippetId}"></iframe>`);

                // We only need to call set _overrideSession in testing case
                // because testing code has not been updated to use EmbeddedSession yet.
                (OfficeExtension.ClientRequestContext as any)._overrideSession = session;
            });
        });

        function receiveMessage(event) {
            if (event.origin !== params.origin) {
                return;
            }

            snippetId = event.data;
        }
    }
})();
