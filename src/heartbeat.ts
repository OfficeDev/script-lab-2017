import { Authenticator } from '@microsoft/office-js-helpers';
import { environment } from './environment';
import { settings } from './app/helpers';

(async () => {
    let messenger = new Messenger();
    await environment.determineHost();

    let params = Authenticator.getUrlParams(location.href, location.origin, '?') as any;
    if (params == null || params.host == null) {
        messenger.showError('Invalid runner state, missing "host" parameter. Please close and try again.');
        return;
    }

    setInterval(() => {
        let currentSnippet = settings.current.lastOpened;
        if (currentSnippet == null) {
            return;
        }
        else if (currentSnippet.id == null) {
            messenger.showError('Invalid snippet. Please close and try again.');
            return;
        }

        if (!messenger.isEquals(currentSnippet)) {
            return messenger.init();
        }

        if (currentSnippet.lastModified !== messenger.current.lastModified) {
            messenger.sendMessage(currentSnippet.id, MessageType.RELOAD);
            return;
        }
    }, 200);

    window.addEventListener('message', messenger.receive.bind(messenger), false);
})();


class Messenger {
    private _message = window.top.postMessage;
    current: ISnippet;

    init() {
        let snippet = settings.current.lastOpened;
        if (snippet == null || snippet.id == null) {
            this.sendError('Please create or open a snippet in the editor.');
            return null;
        }

        this.current = snippet;

        this.sendMessage({
            snippet: snippet,
            refreshUrl: window.location.origin + '/refresh.html'
        }, MessageType.SNIPPET);
    }


    isEquals(snippet: ISnippet) {
        if (this.current == null || snippet == null) {
            return false;
        }
        else if (snippet.id == null || snippet.id.trim() === '') {
            return false;
        }
        else if (snippet.id !== this.current.id) {
            return false;
        }
        else {
            return true;
        }
    }

    showError(message: string) {
        return this._message({
            type: MessageType.ERROR,
            message
        }, '*' /* Fix target origin */);
    }

    sendError(message: string) {
        return this._message({
            type: MessageType.ERROR,
            message
        }, '*' /* Fix target origin */);
    }

    sendMessage(message: string | any, type: MessageType) {
        return this._message({
            type,
            message
        }, '*' /* Fix target origin */);
    }

    receive(event: MessageEvent) {
        try {
            if (event.origin !== environment.current.config.runnerUrl) {
                return null;
            }

            let {type} = event.data;
            if (type === MessageType.RELOAD) {
                return this.init();
            }
        }
        catch (error) {
            return error;
        }
    }
}

enum MessageType {
    RELOAD,
    ERROR,
    SNIPPET
};
