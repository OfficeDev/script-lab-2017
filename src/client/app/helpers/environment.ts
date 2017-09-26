import * as $ from 'jquery';
import { attempt, isError, isPlainObject } from 'lodash';

import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Strings } from '../strings';

let { devMode, build, config } = PLAYGROUND;
import { isNil } from 'lodash';

const WAC_URL_STORAGE_KEY = 'playground_wac_url';
const EXPERIMENTATION_FLAGS_KEY = 'playground_experimentation_flags';

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
            this._current = {} as ICurrentPlaygroundInfo;
            
            let cachedEnvironment = (this.cache.get('environment') || {}) as {
                host: string;
                platform;
            };

            let aboutToAppend: ICurrentPlaygroundInfo = {
                devMode,
                build,
                config: this._config,

                supportsCustomFunctions: false,

                isAddinCommands: false,
                isTryIt: false,
                wacUrl: window.localStorage[WAC_URL_STORAGE_KEY] || '',

                // And append (override) any existing environment values that may have already been cached
                ...cachedEnvironment
            };

            // Append via "appendCurrent", so that any specific logic can run
            this.appendCurrent(aboutToAppend);

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

        if (!isNil(value.host)) {
            if (value.host.toUpperCase() === 'EXCEL') {
                updatedEnv = {
                    ...updatedEnv,
                    supportsCustomFunctions: this.getExperimentationFlagValue('customFunctions')
                };
            }
        }

        this._current = this.cache.insert('environment', updatedEnv);
    }

    getExperimentationFlagValue(name: 'customFunctions'): any {
        return JSON.parse(this.getExperimentationFlagsString())[name];
    }

    /** Returns a string with a JSON-safe experimentation flags string, or "{}" if not valid JSON */
    getExperimentationFlagsString(): string {
        const flagSetInStorage = window.localStorage[EXPERIMENTATION_FLAGS_KEY];
        const flagsOrError: IExperimentationFlags | Error = attempt(() => JSON.parse(flagSetInStorage));
        const isErrorOrEmpty = isError(flagsOrError) || JSON.stringify(flagsOrError).length === '{}'.length;
        return isErrorOrEmpty ? ('{' + '\n    ' + '\n' + '}') : JSON.stringify(flagsOrError, null, 4);
    }

    /** Sets experimentation flags; will throw an error if the value provided is not a valid JSON-ifiable string.
     * Returns true if update is different than what it was before (while ignoring formatting) */
    updateExperimentationFlags(value: string): boolean {
        let objectAttempt = attempt(() => JSON.parse(value));
        if (isError(objectAttempt) || !isPlainObject(objectAttempt)) {
            throw new Error(Strings().invalidExperimentationFlags);
        }

        const identicalToPreviousSettings =
            JSON.stringify(JSON.parse(this.getExperimentationFlagsString())) === JSON.stringify(objectAttempt);

        if (!identicalToPreviousSettings) {
            window.localStorage[EXPERIMENTATION_FLAGS_KEY] = value;
        }

        return !identicalToPreviousSettings;
    }

    /** Performs a full initialization (and returns quickly out if already initialized
     * of course!) based both on synchronously-available data, and on Office.js or user input
     * (if need manual input to determine host) */
    async initialize(overrides?: { host?: string, tryIt?: boolean }): Promise<void> {
        if (this.initializePartial(overrides)) {
            return;
        }

        await this._initializeHostBasedOnOfficeJsOrUserClick();
    }

    /** Performs a partial initialization, based of off only synchronously-available data
     * (e.g., current page URL, etc.).  Also initialized config, since that is also static based on URL */
    initializePartial(overrides?: { host?: string, tryIt?: boolean }): boolean {
        this._setupCurrentDefaultsIfEmpty();

        let pageParams = (Authenticator.extractParams(window.location.href.split('?')[1]) || {}) as {
            commands: any/* whether app-commands are available, relevant for Office Add-ins */,
            mode: string /* and older way of opening Script Lab to a particular host */,
            host: string /* same as "mode", also needed here so that overrides can also have this parameter */,
            wacUrl: string,
            tryIt: any,
        };
        pageParams = { ...pageParams, ...overrides };

        if (pageParams.wacUrl) {
            this.appendCurrent({ wacUrl: decodeURIComponent(pageParams.wacUrl) });
            window.localStorage.setItem(WAC_URL_STORAGE_KEY, this.current.wacUrl);
        }

        if (pageParams.tryIt) {
            this.appendCurrent({ isTryIt: true });
            this.updateRunnerUrlForWacEmbed();
        }

        if (pageParams.commands) {
            this.appendCurrent({ isAddinCommands: true });
        }


        // Having initialized everything except host and platform based off of page params, do the rest:

        if (pageParams.host) {
            this.appendCurrent({ host: pageParams.host.toUpperCase() });
            return true;
        }

        if (pageParams.mode) {
            this.appendCurrent({ host: pageParams.mode.toUpperCase() });
            return true;
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
                return true;
            }
        }

        if (this.current && this.current.host) {
            return true;
        }


        // If still haven't quit, then don't have enough information to
        // resolve the host info.
        return false;
    }

    updateRunnerUrlForWacEmbed() {
        // If the "try it" page (or the editor used therein) uses an instance of a (non-production)
        // Office Online that is over HTTP instead of HTTPS, the runner will have needed
        // to be on the http domain.  So tweak the in-memory runnerUrl accordingly:

        if (this.current.wacUrl.toLowerCase().indexOf('http:/') === 0) {
            this.appendCurrent({
                config: {
                    ...this.current.config,
                    runnerUrl: this.current.config.runnerUrl.replace('https:/', 'http:/')
                }
            });
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
                        $('#hosts').hide();
                        $('.ms-progress-component__footer').show();
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
