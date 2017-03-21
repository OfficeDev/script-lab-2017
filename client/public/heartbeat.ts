import { environment, settings, Strings, Messenger, MessageType } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';

// Note: this page expects to be initialized with some query parameters.
// See interface definition of HeartbeatParams.

// TODO: Makeshift Listener interface until have appropriate typings for OfficeHelpers listeners
// TODO: Go through the other "FIXME" comments regarding unsubscribe
interface Listener {
    subscribe(callback: () => void);
    unsubscribe();
}

(() => {
    let messenger: Messenger;

    let lastModified: string;

    let snippetListener: Listener;
    let settingsListener: Listener;

    (async () => {
        // Environment will initialize based off of "mode" being passed in to the snippet
        await environment.initialize();
        messenger = new Messenger(environment.current.config.runnerUrl);
        setupRequestReloadListener(messenger);

        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;
        if (params.id) {
            lastModified = params.lastModified;
            createSnippetSpecificListener(params.id);
        } else {
            // TODO (TEMPORARY)
            messenger.send(window.parent, MessageType.ERROR, 'Non-snippet-bound heartbeat not yet supported');
        }
    })();

    function createSnippetSpecificListener(id: string) {
        if (!snippetListener) {
            snippetListener = settings.snippets.notify();

            snippetListener.subscribe(() => {
                settings.snippets.load();
                validateSnippet();
            });
        }

        validateSnippet();


        function validateSnippet() {
            let snippet = settings.snippets.get(id);

            // If found a snippet now, whereas previously had needed to initiate a
            // settings listener, this means that was previously unsaved and now
            // a saved snippet.  In that case, no longer need to listen to settings.
            if (snippet && settingsListener) {
                // FIXME uncomment once we have unsubscribe:
                // settingsListener.unsubscribe();
                // settingsListener = null;
            }

            if (snippet == null) {
                if (settings.lastOpened && (settings.lastOpened.id === id)) {
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

                messenger.send(window.parent, MessageType.ERROR, Strings.Runner.snippetNoLongerExists);
                return;
            }

            if (snippet.modified_at.toString() !== lastModified) {
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

                const immediate =
                    lastModified == null ||
                    lastModified === undefined ||
                    lastModified === '0' ||
                    (lastModified as any) === 0;

                if (immediate) {
                    sendSnippetAndStartTracking(snippet);
                } else {
                    messenger.send(window.parent, MessageType.INFORM_STALE);
                }

                return;
            }
        }
    }

    function setupRequestReloadListener(messenger: Messenger) {
        messenger.listen()
            .filter(({ type }) => type === MessageType.REFRESH_REQUEST)
            .subscribe((input) => {
                try {
                    settings.snippets.load();
                    let snippet = settings.snippets.get(input.message /* message is the snippet ID */);

                    sendSnippetAndStartTracking(snippet);
                }
                catch (e) {
                    messenger.send(window.parent, MessageType.ERROR, Strings.Runner.getCouldNotRefreshSnippetText(e));
                }
            });
    }

    function sendSnippetAndStartTracking(snippet: ISnippet) {
        lastModified = snippet.modified_at.toString();
        createSnippetSpecificListener(snippet.id);

        messenger.send(window.parent, MessageType.REFRESH_RESPONSE, snippet);
    }

})();
