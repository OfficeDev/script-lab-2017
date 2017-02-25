import { Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';

class Settings {
    private _settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage);
    cache = new Storage<any>('playground_cache', StorageType.SessionStorage);

    get current() {
        return this._settings.get(Utilities.host);
    }

    set current(value: ISettings) {
        this._settings.insert(Utilities.host, value);
    }
}

export const settings = new Settings();
