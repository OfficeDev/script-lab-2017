import { Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';

class Settings {
    private _settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage);
    cache = new Storage<any>('playground_cache', StorageType.SessionStorage);

    get current() {
        return this._settings.get(Utilities.host);
    }

    set current(value: ISettings) {
        let updatedSettings = { ...this.current, ...value };
        this._settings.insert(Utilities.host, updatedSettings);
    }
}

export const settings = new Settings();
