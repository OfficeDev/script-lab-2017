import { toNumber } from 'lodash';
import { environment, settings, Strings, Messenger, MessageType } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';

(() => {
    let messenger: Messenger;
    let currentSnippet: {
        id: string;
        lastModified: number;
    };


    (async () => {
        // Environment will initialize based off of "mode" being passed in to the snippet
        await environment.initialize();
        messenger = new Messenger(environment.current.config.runnerUrl);
        setupRequestReloadListener(messenger);

        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        currentSnippet = {
            id: params.id,
            lastModified: params.id ? toNumber(params.lastModified) : 0
        };

        sendBackCurrentSnippet(true /*isInitialLoad*/);

        settings.snippets.notify().subscribe(validateSnippet);
        settings.settings.notify().subscribe(validateSnippet);
    })();


    function validateSnippet() {
        settings.settings.load();
        const lastOpened = settings.current.lastOpened;

        if (lastOpened) {
            if (lastOpened.id !== currentSnippet.id) {
                messenger.send(window.parent, MessageType.INFORM_SWITCHED_SNIPPET, {
                    id: lastOpened.id,
                    name: lastOpened.name
                });

                return;
            }
        }

        // If haven't quit yet, validate and inform (or send back) current snippet:
        sendBackCurrentSnippet(false /*isInitialLoad*/);
    }

    function sendBackCurrentSnippet(isInitialLoad: boolean) {
        if (!isInitialLoad) {
            settings.snippets.load();
        }

        let snippet = settings.snippets.get(currentSnippet.id);
        if (snippet == null) {
            if (settings.lastOpened && (settings.lastOpened.id === currentSnippet.id)) {
                snippet = settings.lastOpened;
            }
        }

        if (snippet == null) {
            messenger.send(window.parent, MessageType.ERROR, Strings.Runner.snippetNoLongerExists);
            return;
        }

        if (snippet.modified_at !== currentSnippet.lastModified) {
            // If was already tracking the snippet and had a real lastModified number set,
            // inform the user that the snippet is stale.  Otherwise, just send it immediately.

            const sendImmediately = isInitialLoad || currentSnippet.lastModified < 1;
            if (sendImmediately) {
                currentSnippet.lastModified = snippet.modified_at;
                messenger.send(window.parent, MessageType.REFRESH_RESPONSE, snippet);
            } else {
                messenger.send<void>(window.parent, MessageType.INFORM_STALE, null);
            }
        }
    }

    function setupRequestReloadListener(messenger: Messenger) {
        messenger.listen<string>()
            .filter(({ type }) => type === MessageType.REFRESH_REQUEST)
            .subscribe((input) => {
                currentSnippet = {
                    id: input.message,
                    lastModified: 0 /* Set to last modified, so that refreshes immediately */
                };

                // The ID on the input.message was optional.  If it was indeed specified, just send it back.  Otherwise, more processing is needed.
                if (currentSnippet.id) {
                    sendBackCurrentSnippet(false /*isInitialLoad*/);
                    return;
                }

                settings.settings.load();
                const lastOpened = settings.current.lastOpened;
                if (lastOpened) {
                    messenger.send(window.parent, MessageType.REFRESH_RESPONSE, lastOpened);
                    return;
                }

                messenger.send(window.parent, MessageType.ERROR, Strings.Runner.noSnippetIsCurrentlyOpened);
            });
    }

})();
