import * as $ from 'jquery';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
let { devMode, build, config } = PLAYGROUND;

class Environment {
    private _config: IEnvironmentConfig;
    cache = new Storage<any>(PLAYGROUND.localStorageKeys.playgroundCache, StorageType.SessionStorage);

    constructor() {
        if (devMode) {
            this._config = config.local;
        }
        else {
            let { origin } = location;
            if (/bornholm-insiders/.test(origin)) {
                this._config = config.insiders;
            }
            else if (/bornholm-edge/.test(origin)) {
                this._config = config.edge;
            }
            else {
                this._config = config.production;
            }
        }
    }

    private _current: ICurrentPlaygroundInfo;
    private _setupCurrentDefaultsIfEmpty() {
        if (!this._current) {
            let host: string;
            let platform: string;
            let environment = this.cache.get('environment') as ICurrentPlaygroundInfo;
            if (environment) {
                host = environment.host;
                platform = environment.platform;
            }

            this._current = {
                devMode,
                build,
                config: this._config,
                host: host,
                platform: platform
            };

            this.cache.insert('environment', this._current);
        }
    }

    get current(): ICurrentPlaygroundInfo {
        this._setupCurrentDefaultsIfEmpty();
        return this._current;
    }

    set current(value: ICurrentPlaygroundInfo) {
        this._setupCurrentDefaultsIfEmpty();
        let updatedEnv = { ...this._current, ...value };
        this._current = this.cache.insert('environment', updatedEnv);
    }

    async initialize(currHost?: string, currPlatform?: string): Promise<void> {
        this._setupCurrentDefaultsIfEmpty();

        if (currHost) {
            this.current = {
                ...this.current,
                host: currHost,
                platform: currPlatform
            };

            return;
        }

        if (this.current && this.current.host) {
            return;
        }

        let { host, platform } = await new Promise<{ host: string, platform: string }>(resolve => {
            if (window.location.search.toLowerCase().indexOf('mode') > 0) {
                let { mode } = Authenticator.getUrlParams(window.location.search, '', '?') as any;
                return resolve({ host: mode.toUpperCase(), platform: null });
            } else if (/#\/view\/|#\/edit\//.test(location.hash)) {
                const [view, type, host] = location.hash.toLowerCase().replace('#/', '').split('/');
                if (view && type && host) {
                    return resolve({ host: host.toUpperCase(), platform: null });
                }
                return resolve({ host: null, platform: null });
            }
            else {
                let hostButtonsTimeout = setTimeout(() => {
                    $('#hosts').show();
                    $('.ms-progress-component__footer').hide();
                    $('.hostButton').click(function hostButtonClick() {
                        resolve({ host: $(this).data('host'), platform: null });
                    });
                }, 2000);

                Office.initialize = () => {
                    let { host, platform } = Utilities;
                    if (platform) {
                        clearTimeout(hostButtonsTimeout);
                        return resolve({ host, platform });
                    }
                };
            }
        });

        this.current = {
            ...this.current,
            host,
            platform
        };
    }
}

export const environment = new Environment();
