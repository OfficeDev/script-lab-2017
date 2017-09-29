import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';
import * as cuid from 'cuid';

class StorageHelper {
    LocalStorageKey_PlaygroundSettings = 'playground_settings';
    get LocalStorageKey_PlaygroundHostSnippets() {
        return `playground_${environment.current.host}_snippets`;
    }

    SessionStorageKey_IntelliSenseCache = 'playground_intellisense';


    private _settings: Storage<ISettings>;
    get settings() {
        if (!this._settings) {
            this._settings = new Storage<ISettings>(this.LocalStorageKey_PlaygroundSettings);
        }
        return this._settings;
    }

    private _intellisenseCache: Storage<string>;
    get intellisenseCache() {
        if (!this._intellisenseCache) {
            this._intellisenseCache = new Storage<string>(this.SessionStorageKey_IntelliSenseCache, StorageType.SessionStorage);
            if (environment.current.devMode) {
                this._intellisenseCache.clear();
            }
        }
        return this._intellisenseCache;
    }

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

    private _snippets: Storage<ISnippet> = null;
    get snippets() {
        if (this._snippets == null && environment.current && environment.current.host) {
            this._snippets = new Storage<ISnippet>(this.LocalStorageKey_PlaygroundHostSnippets);
        }
        return this._snippets;
    }

    get lastOpened() {
        return this.current && this.current.lastOpened;
    }

    get current(): Readonly<ISettings> {
        if (environment.current && environment.current.host) {
            return this.settings.get(environment.current.host);
        }
        return null;
    }

    appendCurrent(value: Partial<ISettings>) {
        if (environment.current && environment.current.host) {
            let updatedSettings = { ...this.current, ...value };
            this.settings.insert(environment.current.host, updatedSettings as any);
        }
    }
}

export const storage = new StorageHelper();
