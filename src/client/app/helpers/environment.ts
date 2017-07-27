import * as $ from 'jquery';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
let { devMode, build, config } = PLAYGROUND;

class Environment {
    private _config: IEnvironmentConfig;
    cache = new Storage<any>('playground_cache', StorageType.SessionStorage);

    constructor() {
        if (devMode) {
            this._config = config['local'];
        }
        else {
            let { origin } = location;
            if (/bornholm-insiders/.test(origin)) {
                this._config = config['insiders'];
            }
            else if (/bornholm-edge/.test(origin)) {
                this._config = config['edge'];
            }
            else {
                this._config = config['production'];
            }
        }
    }

    private _current: IEnvironment;
    private _setupCurrentDefaultsIfEmpty() {
        if (this._current == null) {
            this._current = {
                devMode,
                build,
                config: this._config
            };

            let environment = this.cache.get('environment') as IEnvironment;
            if (environment) {
                this._current.host = environment.host;
                this._current.platform = environment.platform;
            }

            this.cache.insert('environment', this._current);
        }
    }

    get current(): IEnvironment {
        this._setupCurrentDefaultsIfEmpty();
        return this._current;
    }

    set current(value: IEnvironment) {
        this._setupCurrentDefaultsIfEmpty();
        let updatedEnv = { ...this._current, ...value };
        this._current = this.cache.insert('environment', updatedEnv);
    }

    async initialize(currHost?: string, currPlatform?: string) {
        if (currHost) {
            this.current = { host: currHost, platform: currPlatform };
            return Promise.resolve({ currHost, currPlatform });
        }

        if (this.current && this.current.host) {
            return this.current;
        }

        let { host, platform } = await new Promise<{ host: string, platform: string }>(resolve => {
            if (window.location.search.toLowerCase().indexOf('mode') > 0) {
                let { mode } = Authenticator.getUrlParams(window.location.search, '', '?') as any;
                return resolve({ host: mode.toUpperCase(), platform: null });
            } else if (/#\/view/.test(location.hash)) {
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

        this.current = { host, platform };
        return this.current;
    }
}

export const environment = new Environment();
