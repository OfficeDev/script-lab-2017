import { Observable } from 'rxjs/Observable';
import { AI } from './ai.helper';

export class Messenger {
    constructor(public source: string) { }

    send<T>(recepient: Window, type: MessageType, message: T) {
        return recepient.postMessage({ type, message }, this.source);
    }

    listen<T>() {
        return new Observable<{ type: MessageType, message: T }>(observer => {
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

export enum MessageType {
    /** Error. Also carries a string message */
    ERROR,

    /** A message to let the runner know to show a "would you like to refresh" dialog.  No actual message content */
    INFORM_STALE,

    /** A message that the currently-editing snippet has changed.  Message is {id: string, name: string} */
    INFORM_SWITCHED_SNIPPET,

    /** A request for refreshing the snippet (from runner to heartbeat).  Message is the ID of the snippet (or empty, if want latest) */
    REFRESH_REQUEST,

    /** A response from heartbeat to runner. Message is the full snippet object */
    REFRESH_RESPONSE
};
