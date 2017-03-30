import * as $ from 'jquery';
import { router } from './router';
import { Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
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
            if (/insiders/.test(origin)) {
                this._config = config['insiders'];
            }
            else if (/edge/.test(origin)) {
                this._config = config['edge'];
            }
            else {
                this._config = config['production'];
            }
        }
    }

    private _current: IEnvironment;
    get current(): IEnvironment {
        if (this._current == null) {
            this._current = {
                devMode,
                build,
                config: this._config
            };
            let environment = this.cache.get('environment') as IEnvironment;
            if (environment) {
                this.current = { host: environment.host, platform: environment.platform };
            }
        }

        return this._current;
    }

    set current(value: IEnvironment) {
        let updatedEnv = { ...this._current, ...value };
        this._current = this.cache.insert('environment', updatedEnv);
    }

    async initialize(currHost?: string, currPlatform?: string) {
        if (currHost) {
            this.current = { host: currHost, platform: currPlatform };
            router.updateHash({ host: currHost, mode: router.current.mode, id: router.current.id });
            return Promise.resolve({ currHost, currPlatform });
        }

        if (this.current && this.current.host) {
            router.updateHash({ host: this.current.host, mode: router.current.mode, id: router.current.id });
            return this.current;
        }

        let { host, platform } = await new Promise<{ host: string, platform: string }>(resolve => {
            let params = router.current;
            if (!(params == null) && params.host) {
                router.updateHash({ host: params.host, mode: router.current.mode, id: router.current.id });
                return resolve({ host: params.host.toUpperCase(), platform: null });
            }
            else {
                let hostButtonsTimeout = setTimeout(() => {
                    $('#hosts').show();
                    $('.ms-progress-component__footer').hide();
                    $('.hostButton').click(function hostButtonClick() {
                        router.updateHash({ host: $(this).data('host'), mode: router.current.mode, id: router.current.id });
                        resolve({ host: $(this).data('host'), platform: null });
                    });
                }, 2000);

                Office.initialize = () => {
                    clearTimeout(hostButtonsTimeout);
                    let { host, platform } = Utilities;
                    router.updateHash({ host, mode: router.current.mode, id: router.current.id });
                    return resolve({ host, platform });
                };
            }
        });

        this.current = { host, platform };
        return this.current;
    }
}

export const environment = new Environment();
