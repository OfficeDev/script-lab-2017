import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { environment, storageSize, storage, ensureFreshLocalStorage } from '../helpers';
import { Strings, getAvailableLanguages, getDisplayLanguage, setDisplayLanguage } from '../strings';
import { UIEffects } from '../effects/ui';
import { attempt, isError, isEqual } from 'lodash';
const { config, localStorageKeys, sessionStorageKeys } = PLAYGROUND;

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'about',
    template: `
        <dialog [show]="show">
            <div class="about">
                <div class="about__details">
                    <div class="about__primary-text ms-font-xxl">{{config?.build?.name}}</div>
                    <div class="profile__tertiary-text ms-font-m" style="margin-bottom: 20px;">{{strings.userId}}: ${storage.user}</div>
                    <button class="ms-Dialog-action ms-Button" style="margin-bottom: 20px;" (click)="logoutSnippets()">
                        <span class="ms-Button-label">{{strings.logoutFromGraph}}</span>
                    </button>
                    <div class="about__secondary-text ms-font-l">Version: {{config?.build?.version}}
                        <br/><span class="ms-font-m">(Deployed {{config?.build?.humanReadableTimestamp}})</span>
                    </div>
                    <pre class="about__tertiary-text ms-font-m">{{cache}}</pre>
                    <div class="about__language">
                        <select class="about__language-select ms-font-m" [(ngModel)]="currentChosenLanguage">
                            <option *ngFor="let l of availableLanguages" [value]="l.value">{{l.name}}</option>
                        </select>
                    </div>
                    <div class="about__environment">
                        <label class="ms-font-m about__environment-text">{{strings.aboutCurrentEnvironment}}</label>
                        <select class="about__environment-select ms-font-m" [(ngModel)]="selectedConfig">
                            <option *ngFor="let conf of configs" [value]="conf.value">{{conf.name}}</option>
                        </select>
                    </div>
                    <div class="about__special-flags">
                        <div>
                            <label class="ms-font-m">
                                <input type="checkbox" [(ngModel)]="showExperimentationFlags" />
                                {{strings.showExperimentationFlags}}
                            </label>
                        </div>
                        <div *ngIf="showExperimentationFlags" class="ms-TextField ms-TextField--multiline">
                            <textarea class="ms-TextField-field" [(ngModel)]="experimentationFlags" (keyup)="onExperimentationFlagsChange()"></textarea>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="okClicked()">
                        <span class="ms-Button-label">{{strings.ok}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

export class About implements AfterViewInit {
    @Input() show: boolean;
    @Output() showChange = new EventEmitter<boolean>();

    strings = Strings();

    private _hostSnippetsStorageKey = localStorageKeys.hostSnippets_parameterized
        .replace('{0}', environment.current.host);
    cache = [
        `${Strings().aboutStorage}`,
        `${storageSize(localStorage, this._hostSnippetsStorageKey, Strings().aboutSnippets)}`,
        `${storageSize(sessionStorage, sessionStorageKeys.intelliSenseCache, Strings().aboutIntellisense)}`,
    ].join('\n');

    config = {
        build: environment.current.build,
    };

    availableLanguages = [] as { name: string, value: string }[];
    currentChosenLanguage = '';
    originalLanguage = '';

    configs: {name: string, value: string }[] = [];
    selectedConfig = '';

    showExperimentationFlags = false;
    experimentationFlags = '';

    constructor(
        private _effects: UIEffects
    ) {
    }

    ngAfterViewInit() {
        this.availableLanguages = getAvailableLanguages();
        this.currentChosenLanguage = getDisplayLanguage();
        this.originalLanguage = this.currentChosenLanguage;

        const isLocalHost = (environment.current.config.name === config.local.name ||
            /localhost/.test(window.localStorage.getItem(localStorageKeys.originEnvironmentUrl)));
        const isBeta = environment.current.config.name === config.insiders.name;
        const isProd = environment.current.config.name === config.production.name;

        this.configs = [
            { name: this.strings.production, value: config.production.name },

            // To avoid clutter, only show staging site if you're not on prod or beta
            (!(isProd || isBeta)) ? { name: this.strings.staging, value: config.staging.name } : null,

            { name: this.strings.beta, value: config.insiders.name },
            { name: this.strings.alpha, value: config.edge.name },

            // User can only navigate to localhost if they've sideloaded local manifest
            isLocalHost ? { name: config.local.editorUrl, value: config.local.name } : null
        ].filter(item => item != null);

        ensureFreshLocalStorage();

        this.selectedConfig = this.configs.find(c => c.value.toUpperCase() === environment.current.config.name).value;

        this.experimentationFlags = environment.getExperimentationFlagsString(true /*onEmptyReturnDefaults*/);
        const isEffectivelyEmpty = isEqual(JSON.parse(this.experimentationFlags), PLAYGROUND.experimentationFlagsDefaults);
        this.showExperimentationFlags = !isEffectivelyEmpty;
    }

    async okClicked() {
        let needsWindowReload = false;


        this.experimentationFlags = this.experimentationFlags.trim();
        if (this.experimentationFlags.length === 0) {
            this.experimentationFlags = '{}';
        }

        let experimentationUpdateResultOrError =
            attempt(() => environment.updateExperimentationFlags(this.experimentationFlags));

        if (isError(experimentationUpdateResultOrError)) {
            await this._effects.alert(experimentationUpdateResultOrError.message, this.strings.error, this.strings.ok);
            return;
        } else if (experimentationUpdateResultOrError === true) {
            needsWindowReload = true;
        } else {
            // If this component gets re-opened, want to have a re-formatted string, in case it changed.
            this.experimentationFlags = environment.getExperimentationFlagsString(true /*onEmptyReturnDefaults*/);
        }


        if (this.currentChosenLanguage !== this.originalLanguage) {
            setDisplayLanguage(this.currentChosenLanguage);
            needsWindowReload = true;
        }


        if (needsWindowReload) {
            this._effects.alert(this.strings.scriptLabIsReloading, this.strings.pleaseWait);
            window.location.reload();
            return;
        }


        this.showChange.emit(false);

        await this._handleEnvironmentSwitching();
    }

    logoutSnippets() {
        window.open(
            _generateAuthUrl({ client_id: environment.current.config.thirdPartyAADAppClientId, resource: 'graph' }),
            '_blank',
            'width=1024,height=768'
        );

        // This function should remain roughly in sync with "auth-helpers.ts"
        function _generateAuthUrl(params: {
            resource: string;
            client_id: string;
        }): string {
            const queryParams = [
                `auth_action=logout`,
                `client_id=${encodeURIComponent(params.client_id)}`,
                `resource=${params.resource}`
            ].join('&');

            return environment.current.config.runnerUrl + '/snippet/auth?' + queryParams;
        }
    }

    onExperimentationFlagsChange() {
        if (this.experimentationFlags.trim().length === 0) {
            this.experimentationFlags = JSON.stringify(PLAYGROUND.experimentationFlagsDefaults, null, 4);
        }
    }

    async _handleEnvironmentSwitching() {
        let currentConfigName = environment.current.config.name.toLowerCase();
        if (this.selectedConfig === currentConfigName) {
            return;
        }

        let changeEnvironmentMessage = this.strings.aboutSwitchEnvironment
            .replace('{0}', this.configs.find(c => c.value === currentConfigName).name)
            .replace('{1}', this.configs.find(c => c.value === this.selectedConfig).name);
        let changeEnvironmentResult = await this._effects.alert(
            this.strings.changeEnvironmentConfirm,
            changeEnvironmentMessage,
            this.strings.ok,
            this.strings.cancel
        );
        if (changeEnvironmentResult === this.strings.cancel) {
            this.selectedConfig = this.configs.find(c => c.value === currentConfigName).value;
            return;
        }

        ensureFreshLocalStorage();
        let originEnvironment = window.localStorage.getItem(localStorageKeys.originEnvironmentUrl);
        let targetEnvironment = config[this.selectedConfig].editorUrl;

        // Add query string parameters to default editor URL
        if (originEnvironment) {
            window.location.href = `${originEnvironment}?targetEnvironment=${encodeURIComponent(targetEnvironment)}`;
        } else {
            window.localStorage.setItem(localStorageKeys.redirectEnvironmentUrl, targetEnvironment);
            window.location.href = `${targetEnvironment}?originEnvironment=${encodeURIComponent(environment.current.config.editorUrl)}`;
        }
    }
}
