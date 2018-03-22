import { toNumber } from 'lodash';
import { environment, storage, Messenger, RunnerMessageType, trustedSnippetManager, ensureFreshLocalStorage } from '../app/helpers';
import { Strings } from '../app/strings';
import { Authenticator } from '@microsoft/office-js-helpers';
const { localStorageKeys } = PLAYGROUND;

(() => {
    let messenger: Messenger<RunnerMessageType>;
    let trackingSnippet: {
        id: string;
        lastModified: number;
    };

    let previousEditorLastChanged: number = Number(window.localStorage.getItem(localStorageKeys.editorLastChanged));
    // let editorChangePoller: number;

    (() => {
        const params: HeartbeatParams = Authenticator.extractParams(window.location.href.split('?')[1]) as any;

        // Can do partial initialization, since host is guaranteed to be known
        environment.initializePartial({ host: params.host });

        // In case the params have had a different runner URL passed in, update the environment config.
        // Note that for reasons unbeknown, just updating the environment *even with the same URL*
        // Is causing Internet Explorer, at least within an Office Add-in, to throw "SecurityError"-s.
        // So, only doing the update if needed (the only use-case today for different runner URLs
        // is outside the add-in anyway)
        if (params.runnerUrl && environment.current.config.runnerUrl !== params.runnerUrl) {
            environment.appendCurrent({
                config: {
                    ...environment.current.config,
                    runnerUrl: params.runnerUrl
                }
            });
        }

        messenger = new Messenger(environment.current.config.runnerUrl);
        setupRequestReloadListener(messenger);

        trackingSnippet = {
            id: params.id,
            lastModified: params.id ? toNumber(params.lastModified) || 0 : 0
            /* Note: toNumber returns NaN on empty, but NaN || 0 gives 0. */
        };

        messenger.send(window.parent, RunnerMessageType.HEARTBEAT_INITIALIZED, {
            lastOpenedId: storage.lastOpened ? storage.lastOpened.id : null
        });

        if (trackingSnippet.lastModified === 0) {
            sendBackCurrentSnippet(
                true /*settingsAreFresh: true because just loaded the page*/,
                false /*isTrustedSnippet: only trust snippet through user action*/);
        }

        // storage.snippets.notify().subscribe(validateSnippet);
        // storage.settings.notify().subscribe(validateSnippet);

        // TODO where to clean up the poller?
        // editorChangePoller = setInterval(() => {
        setInterval(() => {
            ensureFreshLocalStorage();
            const newTimestamp = Number(window.localStorage.getItem(localStorageKeys.editorLastChanged));
            if (newTimestamp > previousEditorLastChanged) {
                validateSnippet();
                previousEditorLastChanged = newTimestamp;
            }
        }, 500);
    })();


    function validateSnippet() {
        // FIXME maybe
        storage.settings.load();
        const lastOpened = storage.current.lastOpened;

        if (lastOpened) {
            if (lastOpened.id !== trackingSnippet.id) {
                messenger.send(window.parent, RunnerMessageType.INFORM_SWITCHED_SNIPPET, {
                    id: lastOpened.id,
                    name: lastOpened.name
                });

                return;
            }
        }

        // If haven't quit yet, validate and inform (or send back) current snippet:
        sendBackCurrentSnippet(
            false /*settingsAreFresh: not fresh, will need to reload*/,
            false /*isTrustedSnippet: only trust snippet through user action*/);
    }

    function sendBackCurrentSnippet(settingsAreFresh: boolean, isTrustedSnippet: boolean) {
        if (!settingsAreFresh) {
            storage.snippets.load();
        }

        let snippet: ISnippet;
        if (trackingSnippet.id) {
            snippet = storage.snippets.get(trackingSnippet.id);

            if (snippet == null) {
                if (!settingsAreFresh) {
                    storage.settings.load();
                }

                if (storage.lastOpened && storage.lastOpened.id === trackingSnippet.id) {
                    snippet = storage.lastOpened;
                }
            }
        } else {
            if (!settingsAreFresh) {
                storage.settings.load();
            }

            if (storage.lastOpened) {
                trackingSnippet.id = storage.lastOpened.id;
                snippet = storage.lastOpened;
            } else {
                messenger.send(window.parent, RunnerMessageType.ERROR, Strings().Runner.noSnippetIsCurrentlyOpened);
                return;
            }
        }

        if (snippet == null) {
            trackingSnippet = {
                id: '',
                lastModified: 0
            };

            messenger.send(window.parent, RunnerMessageType.ERROR, Strings().Runner.snippetNoLongerExists);
            return;
        }

        // Upon user trusting snippet, update in local storage
        if (isTrustedSnippet) {
            trustedSnippetManager.trustSnippet(snippet.id);
        }

        if (snippet.modified_at !== trackingSnippet.lastModified) {
            // If was already tracking the snippet and had a real lastModified number set,
            // inform the user that the snippet is stale.  Otherwise, just send it immediately.

            const sendImmediately = trackingSnippet.lastModified < 1;
            if (sendImmediately) {
                trackingSnippet.lastModified = snippet.modified_at;
                isTrustedSnippet = trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId);
                messenger.send(window.parent, RunnerMessageType.REFRESH_RESPONSE, { snippet: snippet, isTrustedSnippet: isTrustedSnippet });
            } else {
                messenger.send<{ name: string }>(window.parent, RunnerMessageType.INFORM_STALE, {
                    name: snippet.name
                });
            }
        }
    }

    function setupRequestReloadListener(messenger: Messenger<RunnerMessageType>) {
        messenger.listen<{ id: string, isTrustedSnippet: boolean }>()
            .filter(({ type }) => type === RunnerMessageType.REFRESH_REQUEST)
            .subscribe((input) => {
                trackingSnippet = {
                    id: input.message.id,
                    lastModified: 0 /* Set to last modified, so that refreshes immediately */
                };


                // Note: The ID on the input.message was optional. But "sendBackCurrentSnippet"
                // will be sure to send the last-opened snippet if the ID is empty
                sendBackCurrentSnippet(false /*settingsAreFresh*/, input.message.isTrustedSnippet);
            });

        messenger.listen<{ perf: PerfInfoItem[] }>()
            .filter(({ type }) => type === RunnerMessageType.SNIPPET_PERF_DATA)
            .subscribe((input) => {
                ensureFreshLocalStorage();
                storage.snippets.load();
                const snippet = storage.snippets.get(trackingSnippet.id);
                snippet.perfInfo = {
                    timestamp: trackingSnippet.lastModified,
                    data: input.message.perf
                };
                storage.snippets.insert(snippet.id, snippet);

                window.localStorage.setItem(localStorageKeys.lastPerfNumbersTimestamp, Date.now().toString());
            });
    }

})();
