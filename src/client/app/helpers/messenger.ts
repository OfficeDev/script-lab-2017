import { Observable } from 'rxjs/Observable';
import { AI } from './ai.helper';

export class Messenger<T> {
    constructor(public source: string) { }

    send<M>(recepient: Window, type: T, message: M) {
        return recepient.postMessage({ type, message }, this.source);
    }

    listen<M>() {
        return new Observable<{ type: T, message: M }>(observer => {
            function _listener(event: MessageEvent) {
                try {
                    if (event.origin !== this._origin) {
                        let { message, type } = event.data;
                        observer.next({ message, type });
                    }
                }
                catch (error) {
                    AI.trackException(error, 'Messenger Service');
                    observer.error(error);
                }
            };

            window.addEventListener('message', _listener, false);

            return () => {
                window.removeEventListener('message', _listener, false);
            };
        });
    }
}

export enum RunnerMessageType {
    /** Error. Also carries a string message */
    ERROR,

    /** A message to let the runner know to show a "would you like to refresh" dialog. Message is {name: string} */
    INFORM_STALE,

    /** A message that the currently-editing snippet has changed.  Message is {id: string, name: string} */
    INFORM_SWITCHED_SNIPPET,

    /** A request for refreshing the snippet (from runner to heartbeat).  Message is the ID of the snippet (or empty, if want latest) */
    REFRESH_REQUEST,

    /** A response from heartbeat to runner. Message is the full snippet object */
    REFRESH_RESPONSE,

    /** A message sent by the heartbeat, once it has initialized.  Message is { lastOpenedId: string } */
    HEARTBEAT_INITIALIZED,

    /** A message sent to the heartbeat, containing perf info for it to write into the snippet (to show up in the editor).  Message is { perf: PerfInfoItem[] } */
    SNIPPET_PERF_DATA,
};

export enum CustomFunctionsMessageType {
    /** From heartbeat to runner, once it's initialized */
    HEARTBEAT_READY,

    /** Message sent from heartbeat to custom-functions, telling that page that it needs to reload.
     * Message is the full payload to be posted to compile/custom-functions
     * (generated using "getCompileCustomFunctionsPayload")
     */
    NEED_TO_REFRESH,

    /** Message sent from runner to hearbeat to inform it that it's now running.  Message is { timestamp: number } */
    LOADED_AND_RUNNING,

    /** A Request to log some data (from runner to heartbeat, since need to be on editor domain)
     * Message is of type LogData
    */
    LOG,

    /** Message from heartbeat to runner, since heartbeat can't open the dialog on its own.
     * Message is null
     */
    SHOW_LOG_DIALOG
};
