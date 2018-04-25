import * as $ from 'jquery';
import { attempt, isError, isPlainObject, isNil, isEqual } from 'lodash';
import { Authenticator, Utilities, Storage, StorageType } from '@microsoft/office-js-helpers';
import { Strings } from '../strings';
import { isValidHost, ensureFreshLocalStorage } from '../helpers';
const { devMode, build, config, localStorageKeys, sessionStorageKeys } = PLAYGROUND;

const WINDOW_PLAYGROUND_HOST_READY_FLAG = 'playground_host_ready';

class Environment {
    cache = new Storage<any>(sessionStorageKeys.environmentCache, StorageType.SessionStorage);
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

        if (/bornholm-(runner-)?edge\./.test(origin)) {
            return config.edge;
        }

        if (/bornholm-(runner-)?insiders\./.test(origin)) {
            return config.insiders;
        }

        if (/bornholm-(runner-)?staging\./.test(origin)) {
            return config.staging;
        }

        // Production has both the azure website serving the content, and the CDN mirrors
        if (/bornholm(-runner)?\./.test(origin) || /script-lab(-runner)?\./.test(origin)) {
            return config.production;
        }

        throw new Error('Unexpected error: invalid Script Lab environment');
    }

    private _setupCurrentDefaultsIfEmpty() {
        if (!this._current) {
            let cachedEnvironment = (this.cache.get('environment') || {}) as ICurrentPlaygroundInfo;
            delete cachedEnvironment.runtimeSessionTimestamp;

            ensureFreshLocalStorage();

            this._current = {
                devMode,
                build,
                config: this._config,

                supportsCustomFunctions: false,
                customFunctionsShowDebugLog: this.getExperimentationFlagValue('customFunctionsShowDebugLog'),

                isAddinCommands: false,
                isTryIt: false,
                wacUrl: window.localStorage.getItem(localStorageKeys.wacUrl) || '' /* ensureFreshLocalStorage is called above */,

                host: null,
                platform: null,

                runtimeSessionTimestamp: (new Date()).getTime().toString()
            };

            this.appendCurrent(cachedEnvironment);

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

    getExperimentationFlagValue(name: 'customFunctions' | 'customFunctionsShowDebugLog'): any {
        return JSON.parse(this.getExperimentationFlagsString(true /*onEmptyReturnDefaults*/))[name];
    }

    /** Returns a string with a JSON-safe experimentation flags string, or "{}" if not valid JSON */
    getExperimentationFlagsString(onEmptyReturnDefaults: boolean): string {
        const objectToReturn = (() => {
            ensureFreshLocalStorage();
            const flagSetInStorage = window.localStorage.getItem(localStorageKeys.experimentationFlags);
            const flagsOrError: IExperimentationFlags | Error = attempt(() => JSON.parse(flagSetInStorage));

            let value = isError(flagsOrError) ? {} : flagsOrError;
            value = {
                ...PLAYGROUND.experimentationFlagsDefaults,
                ...value
            };

            if (isEqual(value, PLAYGROUND.experimentationFlagsDefaults)) {
                return onEmptyReturnDefaults ? PLAYGROUND.experimentationFlagsDefaults : {};
            } else {
                return value;
            }
        })();

        return JSON.stringify(objectToReturn, null, 4);
    }

    /** Sets experimentation flags; will throw an error if the value provided is not a valid JSON-ifiable string.
     * Returns true if update is different than what it was before (while ignoring formatting) */
    updateExperimentationFlags(value: string): boolean {
        let objectAttempt = attempt(() => JSON.parse(value));
        if (isError(objectAttempt) || !isPlainObject(objectAttempt)) {
            throw new Error(Strings().invalidExperimentationFlags);
        }

        if (isEqual(objectAttempt, PLAYGROUND.experimentationFlagsDefaults)) {
            objectAttempt = {};
        }
        const previousSetting = JSON.parse(this.getExperimentationFlagsString(
            false /*onEmptyReturnDefaults = false; instead want actual empty */));
        const identicalToPreviousSettings = isEqual(previousSetting, objectAttempt);

        // Reset the local storage just in case, but to stringified object attempt rather than straight-up value,
        // since objectAttempt may have gotten adjusted.
        window.localStorage.setItem(localStorageKeys.experimentationFlags, JSON.stringify(objectAttempt));

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
            window.localStorage.setItem(localStorageKeys.wacUrl, this.current.wacUrl);
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
            if (pageParams.mode.endsWith('/')) {
                pageParams.mode = pageParams.mode.substr(0, pageParams.mode.length - 1);
            }
            if (pageParams.mode.endsWith('#')) {
                pageParams.mode = pageParams.mode.substr(0, pageParams.mode.length - 1);
            }
            if (isValidHost(pageParams.mode)) {
                this.appendCurrent({ host: pageParams.mode.toUpperCase() });
                return true;
            }
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

    setPlaygroundHostIsReady() {
        (window as any)[WINDOW_PLAYGROUND_HOST_READY_FLAG] = true;
    }

    // For pages that have an "Office.initialize" on them directly
    createPlaygroundHostReadyTimer(): Promise<any>
    // tslint:disable-next-line:one-line
    {
        if (getIsPlaygroundHostReady()) {
            return Promise.resolve(true);
        }

        let interval: any;

        return new Promise((resolve) => {
            interval = setInterval(() => {
                if (getIsPlaygroundHostReady()) {
                    clearInterval(interval);
                    return resolve();
                }
            }, 100);

        });

        // Helper
        function getIsPlaygroundHostReady(): boolean {
            return (window as any)[WINDOW_PLAYGROUND_HOST_READY_FLAG];
        }
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

        const hostInfo = await (async (): Promise<{ host: string, platform: string }> => {
            return new Promise<{ host: string, platform: string }>(async resolve => {
                await this.createPlaygroundHostReadyTimer();

                let { host } = Utilities;
                if (host === 'WEB') {
                    $('#hosts').show();
                    $('.ms-progress-component__footer').hide();
                    $('.hostButton').click(function hostButtonClick() {
                        $('#hosts').hide();
                        $('.ms-progress-component__footer').show();
                        resolve({ host: $(this).data('host'), platform: null });
                    });
                } else {
                    let { platform } = Utilities;
                    return resolve({ host, platform });
                }
            });
        })();


        this.appendCurrent({ ...hostInfo });
        return;
    }
}

export const environment = new Environment();
