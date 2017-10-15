import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';
import * as cuid from 'cuid';
const { localStorageKeys, sessionStorageKeys } = PLAYGROUND;

class StorageHelper {
    private _settings: Storage<ISettings>;
    get settings(): Storage<ISettings> {
        if (!this._settings) {
            this._settings = new Storage<ISettings>(localStorageKeys.settings);
        }
        return this._settings;
    }

    private _intellisenseCache: Storage<string>;
    get intellisenseCache(): Storage<string> {
        if (!this._intellisenseCache) {
            this._intellisenseCache = new Storage<string>(sessionStorageKeys.intelliSenseCache, StorageType.SessionStorage);
            if (environment.current.devMode) {
                this._intellisenseCache.clear();
            }
        }
        return this._intellisenseCache;
    }

    private _snippets: Storage<ISnippet> = null;
    get snippets(): Storage<ISnippet> {
        if (this._snippets == null && environment.current && environment.current.host) {
            const hostStorageKey = localStorageKeys.hostSnippets_parameterized
                .replace('{0}', environment.current.host);
            this._snippets = new Storage<ISnippet>(hostStorageKey);
        }
        return this._snippets;
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
