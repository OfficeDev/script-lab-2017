import { toNumber } from 'lodash';
import { environment, storage, Strings, Messenger, MessageType } from '../app/helpers';
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

        messenger.send(window.parent, MessageType.HEARTBEAT_INITIALIZED, {
            lastOpenedId: storage.lastOpened ? storage.lastOpened.id : null
        });

        sendBackCurrentSnippet(true /*isInitialLoad*/);

        storage.snippets.notify().subscribe(validateSnippet);
        storage.settings.notify().subscribe(validateSnippet);
    })();


    function validateSnippet() {
        storage.settings.load();
        const lastOpened = storage.current.lastOpened;

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
            storage.snippets.load();
        }

        let snippet = storage.snippets.get(currentSnippet.id);
        if (snippet == null) {
            if (storage.lastOpened && (storage.lastOpened.id === currentSnippet.id)) {
                snippet = storage.lastOpened;
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

                storage.settings.load();
                const lastOpened = storage.current.lastOpened;
                if (lastOpened) {
                    messenger.send(window.parent, MessageType.REFRESH_RESPONSE, lastOpened);
                    return;
                }

                messenger.send(window.parent, MessageType.ERROR, Strings.Runner.noSnippetIsCurrentlyOpened);
            });
    }

})();
