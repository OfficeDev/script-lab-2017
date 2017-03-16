import { Storage, StorageType } from '@microsoft/office-js-helpers';
import { environment } from './environment';
import { Observable } from 'rxjs/Observable';

class Settings {
    private _settings = new Storage<ISettings>('playground_settings', StorageType.LocalStorage);
    private _snippets = null;

    onSettingsChanged() {
        return new Observable<void>((observer) => {
            this._settings.notify(() => observer.next());
        });
    }

    onSnippetsChanged() {
        return new Observable<void>((observer) => {
            if (!(this._snippets == null)) {
                this._snippets.notify(() => observer.next());
            }
            return () => {
                /* no tear down */
            };
        });
    }

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
            return this._settings.get(environment.current.host);
        }
        return null;
    }

    set current(value: ISettings) {
        if (environment.current && environment.current.host) {
            let updatedSettings = { ...this.current, ...value };
            this._settings.insert(environment.current.host, updatedSettings);
        }
    }

    reload() {
        this._settings.load();
        this._snippets.load();
    }
}

export const settings = new Settings();
