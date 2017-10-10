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
};

export enum CustomFunctionsMessageType {
    /** Message sent from heartbeat to custom-functions, telling that page that it needs to reload.
     * Message is the full payload to be posted to compile/custom-functions
     * (generated using "getCompileCustomFunctionsPayload")
     */
    NEED_TO_REFRESH,

    /** Message to send back to custom functions runner for debugging.
     * Message is the text.
    */
    SEND_DEBUG_MESSAGE
};
