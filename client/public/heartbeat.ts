import { environment, settings, Strings, Messenger, MessageType } from '../app/helpers';
import { Authenticator } from '@microsoft/office-js-helpers';

// Note: this page expects to be initialized with some query parameters.
// See interface definition of HeartbeatParams.

// TODO: Makeshift Listener interface until have appropriate typings for OfficeHelpers listeners
interface Listener {
    subscribe(callback: () => void);
    unsubscribe();
}

(() => {
    let messenger: Messenger;
    let snippetListener: Listener;
    let settingsListener: Listener;

    (async () => {
        // Environment will initialize based off of "mode" being passed in to the snippet
        await environment.initialize();
        messenger = new Messenger(environment.current.config.runnerUrl);

        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        if (params.id) {
            createSnippetSpecificListener(params);
        } else {
            // TODO (TEMPORARY)
            messenger.send(MessageType.ERROR, 'Non-snippet-bound heartbeat not yet supported');
        }
    })();

    function createSnippetSpecificListener(params: HeartbeatParams) {
        let lastModified = params.lastModified;

        snippetListener = settings.snippets.notify();
        snippetListener.subscribe(() => {
            settings.snippets.load();
            validateSnippet();
        });

        validateSnippet();


        function validateSnippet() {
            let snippet = settings.snippets.get(params.id);

            // If found a snippet now, whereas previously had needed to initiate a
            // settings listener, this means that was previously unsaved and now
            // a saved snippet.  In that case, no longer need to listen to settings.
            if (snippet && settingsListener) {
                settingsListener.unsubscribe();
            }

            if (snippet == null) {
                if (settings.lastOpened.id === params.id) {
                    snippet = settings.lastOpened;
                    // Also subscribe to the settings changed event, since it looks like this
                    // is an unsaved snippet -- and hence deleting it would not get reflected
                    // if don't also listen to settings:
                    settingsListener = settings.settings.notify();
                    settingsListener.subscribe(() => {
                        settings.settings.load();
                        validateSnippet();
                    });
                }
            }

            if (snippet == null) {
                // If cannot find snippet on a snippet-specific listener, unsubscribe
                // and message back an error (not recoverable without the user going back):
                snippetListener.unsubscribe();
                if (settingsListener) {
                    settingsListener.unsubscribe();
                }

                messenger.send(MessageType.ERROR, Strings.Runner.snippetNoLongerExists);
                return;
            }

            if (snippet.modified_at.toString() !== lastModified) {
                // Update the "last modified" to current timestamp:
                lastModified = snippet.modified_at.toString();

                // Change means that no longer an unsaved snippet.
                // so can stop listening to settings:
                // TODO
                // if (settingsListener) {
                //     settingsListener.unsubscribe();
                // }

                messenger.send(MessageType.RELOAD, snippet);
                return;
            }
        }
    }

})();
