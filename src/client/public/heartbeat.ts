import { toNumber } from 'lodash';
import { environment, settings, Strings, Messenger, MessageType } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';

(() => {
    let messenger: Messenger;
    let trackingSnippet: {
        id: string;
        lastModified: number;
    };
    let snippetListener: any;
    let settingsListener: any;

    (async () => {
        // Environment will initialize based off of "mode" being passed in to the snippet
        await environment.initialize();
        messenger = new Messenger(environment.current.config.runnerUrl);
        setupRequestReloadListener(messenger);

        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        trackingSnippet = {
            id: params.id || '',
            lastModified: params.id ? toNumber(params.lastModified) : 0
        };

        params.id ? createSnippetSpecificListener() : createCurrentlyEditingListener();
    })();


    function createSnippetSpecificListener() {
        if (!snippetListener) {
            snippetListener = settings.snippets.notify();

            snippetListener.subscribe(() => {
                settings.snippets.load();
                validateSnippet();
            });
        }

        validateSnippet();


        // Helper

        function validateSnippet() {
            settings.snippets.load();
            let snippet = settings.snippets.get(trackingSnippet.id);

            // If found a snippet now, whereas previously had needed to initiate a
            // settings listener, this means that was previously unsaved and now
            // a saved snippet.  In that case, no longer need to listen to settings.
            if (snippet && settingsListener) {
                // FIXME uncomment once we have unsubscribe:
                // settingsListener.unsubscribe();
                // settingsListener = null;
            }

            if (snippet == null) {
                settings.settings.load();
                if (settings.lastOpened && (settings.lastOpened.id === trackingSnippet.id)) {
                    snippet = settings.lastOpened;
                    // Also subscribe to the settings changed event, since it looks like this
                    // is an unsaved snippet -- and hence deleting it would not get reflected
                    // if don't also listen to settings:

                    if (!settingsListener) {
                        settingsListener = settings.settings.notify();
                    }

                    settingsListener.subscribe(() => {
                        settings.settings.load();
                        validateSnippet();
                    });
                }
            }

            if (snippet == null) {
                // If cannot find snippet on a snippet-specific listener, unsubscribe
                // and message back an error (not recoverable without the user going back):

                // FIXME uncomment once we have unsubscribe:
                // snippetListener.unsubscribe();
                // if (settingsListener) {
                //     settingsListener.unsubscribe();
                // }
                // snippetListener = null;
                // settingsListener = null;

                messenger.send(window.parent, MessageType.ERROR, Strings.Runner.snippetNoLongerExistsUnrecoverable);
                return;
            }

            if (snippet.modified_at !== trackingSnippet.lastModified) {
                // Unsubscribe from listeners.  Nothing to do now, until the user decides
                // that they do want to reload -- and at that point, the runner frame will
                // send a message, asking for the latest.

                // FIXME uncomment once we have unsubscribe:
                // snippetListener.unsubscribe();
                // if (settingsListener) {
                //     settingsListener.unsubscribe();
                // }
                // snippetListener = null;
                // settingsListener = null;


                // If was already tracking the snippet and had a real lastModified number set,
                // inform the user that the snippet is stale.  Otherwise, just send it immediately.
                if (trackingSnippet.lastModified) {
                    messenger.send(window.parent, MessageType.INFORM_STALE);
                } else {
                    trackingSnippet.lastModified = snippet.modified_at;
                    messenger.send(window.parent, MessageType.REFRESH_RESPONSE, snippet);
                }
            }
        }
    }

    function createCurrentlyEditingListener() {
        if (!settingsListener) {
            settingsListener = settings.settings.notify();

            settingsListener.subscribe(() => {
                settings.settings.load();
                validateSnippet();
            });
        }

        validateSnippet();


        // Helper

        function validateSnippet() {
            settings.settings.load();
            let snippet = settings.lastOpened;

            if (snippet == null) {
                messenger.send(window.parent, MessageType.ERROR, 'No snippet is opened. Please open a snippet in the editor.'); // FIXME

                // But keep on listening (don't unsubscribe from settings notifications, just exit the function for the present)
                return;
            }

            if (snippet.id === trackingSnippet.id) {
                if (snippet.modified_at !== trackingSnippet.lastModified) {
                    if (trackingSnippet.lastModified) {
                        messenger.send(window.parent, MessageType.INFORM_STALE);
                    } else {
                        trackingSnippet.lastModified = snippet.modified_at;
                        messenger.send(window.parent, MessageType.REFRESH_RESPONSE, snippet);
                    }
                }
            } else {
                // When switching between snippets, just switch
                trackingSnippet = {
                    id: snippet.id,
                    lastModified: snippet.modified_at
                };

                messenger.send(window.parent, MessageType.REFRESH_RESPONSE, snippet);
            }
        }
    }

    function setupRequestReloadListener(messenger: Messenger) {
        messenger.listen()
            .filter(({ type }) => type === MessageType.REFRESH_REQUEST)
            .subscribe((input) => {
                const id = input.message as string /* message is the snippet ID */ || '';
                const lastModified = 0; // Set to last modified, so that refreshes immediately

                trackingSnippet = { id, lastModified };

                try {
                    (id ? createSnippetSpecificListener() : createCurrentlyEditingListener());
                }
                catch (e) {
                    messenger.send(window.parent, MessageType.ERROR, Strings.Runner.getCouldNotRefreshSnippetText(e));
                }
            });
    }

})();
