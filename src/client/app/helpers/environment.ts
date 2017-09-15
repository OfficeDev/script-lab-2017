import * as $ from 'jquery';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
let { devMode, build, config } = PLAYGROUND;

const WAC_URL_STORAGE_KEY = 'playground_wac_url';

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
                platform: platform,

                isAddinCommands: false,
                isTryIt: false,
                wacUrl: window.localStorage[WAC_URL_STORAGE_KEY]
            };

            this.cache.insert('environment', this._current);
        }
    }

    get current(): Readonly<ICurrentPlaygroundInfo> {
        this._setupCurrentDefaultsIfEmpty();
        return this._current;
    }

    appendCurrent(value: Partial<ICurrentPlaygroundInfo>) {
        this._setupCurrentDefaultsIfEmpty();
        let updatedEnv = { ...this._current, ...value };
        this._current = this.cache.insert('environment', updatedEnv);
    }

    async initialize(currHost?: string): Promise<void> {
        this._setupCurrentDefaultsIfEmpty();


        let pageParams = (Authenticator.extractParams(window.location.href.split('?')[1]) || {}) as {
            commands: any/* whether app-commands are available, relevant for Office Add-ins */,
            mode: string /* and older way of opening Script Lab to a particular host */,
            wacUrl: string,
            tryIt: any
        };

        if (pageParams.wacUrl) {
            this.appendCurrent({ wacUrl: decodeURIComponent(pageParams.wacUrl) });
            window.localStorage.setItem(WAC_URL_STORAGE_KEY, this.current.wacUrl);
        }

        if (pageParams.tryIt) {
            this.appendCurrent({ isTryIt: true });
        }

        if (pageParams.commands) {
            this.appendCurrent({ isAddinCommands: true });
        }


        // Having initialized everything except host and platform based off of page params, do the rest:

        if (currHost) {
            this.appendCurrent({ host: currHost.toUpperCase() });
            return;
        }

        if (pageParams.mode) {
            this.appendCurrent({ host: pageParams.mode.toUpperCase() });
            return;
        }

        if (location.hash) {
            const viewVsEditAndHostRegex = /^#\/(view|edit)\/(\w+)/;
            /* The regex captures input as follows:
                #/edit/excel/samples/id    ==> success, group 1 = edit, group 2 = excel
                #/edit/EXCEL/samples/id    ==> success, group 1 = edit, group 2 = EXCEL
                #/view/EXCEL/samples/id    ==> success, group 1 = view, group 2 = EXCEL
                #/view/EXCEL   ==> success, group 1 = view, group 2 = EXCEL
                #/view/EXCEL/   ==> success, group 1 = view, group 2 = EXCEL

                ... and fails on anything else.
             */

            let regexResult = viewVsEditAndHostRegex.exec(location.hash);
            if (regexResult) {
                this.appendCurrent({ host: regexResult[2].toUpperCase() });
                return;
            }
        }

        if (this.current && this.current.host) {
            return;
        }


        // If no information was gleamed through the function parameter, from the URL,
        // or from existing values, let's either wait on Office.js to give us the host & platform info,
        // or rely on the user to select from one of the buttons:

        const hostInfo = await getAsyncHostInfo();
        this.appendCurrent({ ...hostInfo });
        return;


        async function getAsyncHostInfo(): Promise<{ host: string, platform: string }> {
            return new Promise<{ host: string, platform: string }>(resolve => {
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
            });
        };
    }
}

export const environment = new Environment();
