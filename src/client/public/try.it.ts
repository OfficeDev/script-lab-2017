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
        window.addEventListener('message', receiveMessage, false);
        $(document).ready(() => {
            let url = params.wacUrl;
            let session = new (OfficeExtension as any).EmbeddedSession(url, { id: 'embed-frame', container: document.getElementById('panel-bottom') });
            session.init().then(() => {
                $('.runner-frame').remove();
                $('.panel.right').append(`<iframe class="runner-frame" id="runner-frame" src="${params.runnerSnippetUrl}${snippetId}"></iframe>`);

                (OfficeExtension.ClientRequestContext as any)._overrideSession = session;
            });
        });

        function receiveMessage(event) {
            if (event.origin !== params.origin) {
                return;
            }

            snippetId = event.data.id;
        }
    }
})();
