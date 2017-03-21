import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';

class Settings {
    private _snippets: Storage<ISnippet> = null;

    settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage);

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
