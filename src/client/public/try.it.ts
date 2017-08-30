import * as $ from 'jquery';
import '../assets/styles/extras.scss';

interface InitializationParams {
    origin: string;
    runnerSnippetUrl: string;
}

(() => {
    (window as any).in_try_it_mode = true;
    (window as any).initializeSliders = initializeSliders;
    (window as any).initializeTryIt = initializeTryIt;
    let snippetId;

    function initializeSliders(): void {
        $('.panel-left').resizable({
            handleSelector: '.splitter',
            resizeHeight: false
        });
    }

    function initializeTryIt(params: InitializationParams): void {
        $(document).ready(() => {
            window.addEventListener('message', receiveMessage, false);
            let url = 'http://minint-qrgpmk8.redmond.corp.microsoft.com/th/FrameWAC.aspx?Fi=anonymous%7ETestAgave%2Exlsx&odsiauth=1%7cGN%3dR3Vlc3Q%3d%26SN%3dMTM5MzA2ODA5OQ%3d%3d%26IT%3dNTI0ODA3NzMyMjE1MTM0OTc2MA%3d%3d%26PU%3dMTM5MzA2ODA5OQ%3d%3d%26SR%3dYW5vbnltb3Vz%26TZ%3dMTExOQ%3d%3d%26SA%3dRmFsc2U%3d%26LE%3dRmFsc2U%3d%26AG%3dVHJ1ZQ%3d%3d%26RH%3dBdbz-qDLdjINpt4kWEQVyXNMz3LkAbZyP6URW6_sssI%3d&Action=EmbedView&Application=Excel&transport=wopi&AllowTyping=True';
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
