import { Observable } from 'rxjs/Observable';

export class Messenger {
    constructor(public source: string) { }

    send(type: MessageType, message: any) {
        return window.top.postMessage({ type, message }, this.source);
    }

    listen() {
        return new Observable<{ type: MessageType, message: any }>(observer => {
            function _listener(event: MessageEvent) {
                try {
                    if (event.origin !== this._origin) {
                        let { message, type } = event.data;
                        observer.next({ message, type });
                    }
                }
                catch (error) {
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
    NEEDS_RELOAD,
    RELOAD,
    ERROR,
    SNIPPET
};
