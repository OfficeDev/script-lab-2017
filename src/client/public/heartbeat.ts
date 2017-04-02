import { toNumber } from 'lodash';
import { environment, storage, Strings, Messenger, MessageType } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';

(() => {
    let messenger: Messenger;
    let trackingSnippet: {
        id: string;
        lastModified: number;
    };


    (async () => {
        // Environment will initialize based off of "mode" being passed in to the snippet
        await environment.initialize();
        messenger = new Messenger(environment.current.config.runnerUrl);
        setupRequestReloadListener(messenger);

        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        trackingSnippet = {
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
            if (lastOpened.id !== trackingSnippet.id) {
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

        let snippet: ISnippet;
        if (trackingSnippet.id) {
            snippet = storage.snippets.get(trackingSnippet.id);

            if (snippet == null) {
                if (!isInitialLoad) {
                    storage.settings.load();
                }

                if (storage.lastOpened && storage.lastOpened.id === trackingSnippet.id) {
                    snippet = storage.lastOpened;
                }
            }
        } else {
            if (!isInitialLoad) {
                storage.settings.load();
            }

            if (storage.lastOpened) {
                trackingSnippet.id = storage.lastOpened.id;
                snippet = storage.lastOpened;
            } else {
                messenger.send(window.parent, MessageType.ERROR, Strings.Runner.noSnippetIsCurrentlyOpened);
                return;
            }
        }

        if (snippet == null) {
            trackingSnippet = {
                id: '',
                lastModified: 0
            };

            messenger.send(window.parent, MessageType.ERROR, Strings.Runner.snippetNoLongerExists);
            return;
        }

        if (snippet.modified_at !== trackingSnippet.lastModified) {
            // If was already tracking the snippet and had a real lastModified number set,
            // inform the user that the snippet is stale.  Otherwise, just send it immediately.

            const sendImmediately = isInitialLoad || trackingSnippet.lastModified < 1;
            if (sendImmediately) {
                trackingSnippet.lastModified = snippet.modified_at;
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
                trackingSnippet = {
                    id: input.message,
                    lastModified: 0 /* Set to last modified, so that refreshes immediately */
                };


                // Note: The ID on the input.message was optional. But "sendBackCurrentSnippet"
                // will be sure to send the last-opened snippet if the ID is empty
                sendBackCurrentSnippet(false /*isInitialLoad*/);
            });
    }

})();
