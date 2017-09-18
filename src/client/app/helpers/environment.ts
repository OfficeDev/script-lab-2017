import * as $ from 'jquery';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
let { devMode, build, config } = PLAYGROUND;

const WAC_URL_STORAGE_KEY = 'playground_wac_url';

class Environment {
    cache = new Storage<any>(PLAYGROUND.localStorageKeys.playgroundCache, StorageType.SessionStorage);
    private _config: IEnvironmentConfig;
    private _current: ICurrentPlaygroundInfo;

    constructor() {
        this._config = this._determineConfig();
    }

    private _determineConfig(): IEnvironmentConfig {
        if (devMode) {
            return config.local;
        }

        let origin = location.origin.toLowerCase();

        // Note: need to test both for editor and runner domain, since the runner
        // can (and does) include files from the editor domain, all the while
        // window.location.origin is in runner domain.

        if (/bornholm-(runner-)?insiders\./.test(origin)) {
            return config.insiders;
        }

        if (/bornholm-(runner-)?edge\./.test(origin)) {
            return config.edge;
        }

        // Production has both the azure website serving the content, and the CDN mirrors
        if (/bornholm-(runner-)?\./.test(origin) || /script-lab(-runner)?\./.test(origin)) {
            return config.production;
        }

        throw new Error('Unexpected error: invalid Script Lab environment');
    }

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

    /** Performs a full initialization (and returns quickly out if already initialized
     * of course!) based both on synchronously-available data, and on Office.js or user input
     * (if need manual input to determine host) */
    async initialize(currHost?: string): Promise<void> {
        this.initializePartial(currHost);

        await this._initializeHostBasedOnOfficeJsOrUserClick();
    }

    /** Performs a partial initialization, based of off only synchronously-available data
     * (e.g., current page URL, etc.).  Also initialized config, since that is also static based on URL */
    initializePartial(currHost?: string): void {
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

    }


    private async _initializeHostBasedOnOfficeJsOrUserClick() {
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

                if ((window as any).Office) {
                    Office.initialize = () => {
                        let { host, platform } = Utilities;
                        if (platform) {
                            clearTimeout(hostButtonsTimeout);
                            return resolve({ host, platform });
                        }
                    };
                }
            });
        };
    }
}

export const environment = new Environment();
