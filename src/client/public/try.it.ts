import * as $ from 'jquery';
import * as OfficeJsHelpers from '@microsoft/office-js-helpers';
import { environment, InformationalError } from '../app/helpers';
import { isPlainObject } from 'lodash';

import '../assets/styles/extras.scss';

interface InitializationParams {
    host: string;
    origin: string;
    wacUrl: string;
}

(() => {
    (window as any).in_try_it_mode = true;
    let params: InitializationParams;
    let snippetId;

    (window as any).initializeTryIt = (receivedParams: InitializationParams): void => {
        params = receivedParams;

        window.addEventListener('message', receiveMessage, false);

        function receiveMessage(event) {
            if (event.origin !== params.origin) {
                return;
            }

            if (isPlainObject(event.data) && event.data.type === 'import-complete') {
                snippetId = event.data.id;
                initializeTryItHelper();
            }
        }
    };

    async function initializeTryItHelper() {
        $(document).ready(() => tryCatch(async () => {
            setUpResizables();

            await environment.initialize({ host: params.host, tryIt: true });

            if (!environment.current.wacUrl) {
                throw new InformationalError(
                    `You're accessing a PREVIEW feature... but you don't have the secret code!`,
                    `Until we have a production server set up for the "Try it live" experience, ` +
                    `you'll need to bootstrap the experience with providing a "wacURL" parameter. ` +
                    `Please see the "Prereqs" section of the docs demo page, follow the link there, and then refresh this page.`);
            }

            const session = new (OfficeExtension as any).EmbeddedSession(
                environment.current.wacUrl,
                { id: 'embed-frame', container: document.getElementById('panel-bottom') }
            );

            await session.init();

            let url = `${environment.current.config.runnerUrl}/run/${environment.current.host}`;
            if (snippetId) {
                url += `/${snippetId}`;
            }
            // FIXME: ensure that runner still allows switching via heartbeat.

            $('.runner-frame').remove();
            $('.panel.right').append(`<iframe class="runner-frame" id="runner-frame" src="${url}"></iframe>`);

            (OfficeExtension.ClientRequestContext as any)._overrideSession = session;
        }));
    };

    function setUpResizables() {
        $('.panel.left').resizable({
            handleSelector: '.splitter.vertical',
            resizeHeight: false,
            onDragStart: () => $('iframe').css('pointer-events', 'none'),
            onDragEnd: $('iframe').css('pointer-events', 'auto')
        });

        $('.panel.top').resizable({
            handleSelector: '.splitter.horizontal',
            resizeWidth: false,
            onDragStart: () => $('iframe').css('pointer-events', 'none'),
            onDragEnd: () => $('iframe').css('pointer-events', 'auto')
        });
    }

    async function tryCatch(callback) {
        try {
            await callback();
        }
        catch (error) {
            if (error instanceof InformationalError) {
                OfficeJsHelpers.UI.notify(error.title, error.message, 'warning');
            } else {
                OfficeJsHelpers.UI.notify(error);
            }

            OfficeJsHelpers.Utilities.log(error);
        }
    }
})();
