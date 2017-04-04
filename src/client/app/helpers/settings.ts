import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';
import * as cuid from 'cuid';

class Settings {
    private _user: string;
    get user(): string {
        if (this._user == null) {
            this._user = this.settings.get('userId') as any;
            if (this._user == null) {
                this._user = cuid();
                this.settings.insert('userId', this._user as any);
            }
        }
        return this._user;
    }

    settings = new Storage<ISettings>('playground_settings');
    intellisenseCache = new Storage<string>('playground_intellisense', StorageType.SessionStorage);

    private _snippets: Storage<ISnippet> = null;
    get snippets() {
        if (this._snippets == null && environment.current && environment.current.host) {
            this._snippets = new Storage<ISnippet>(`playground_${environment.current.host}_snippets`);
        }
        return this._snippets;
    }

    get lastOpened() {
        return this.current && this.current.lastOpened;
    }

    get current() {
        if (environment.current && environment.current.host) {
            return this.settings.get(environment.current.host);
        }
        return null;
    }

    set current(value: ISettings) {
        if (environment.current && environment.current.host) {
            let updatedSettings = { ...this.current, ...value };
            this.settings.insert(environment.current.host, updatedSettings);
        }
    }
}

export const settings = new Settings();
