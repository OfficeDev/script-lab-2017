import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { environment, storageSize, storage } from '../helpers';
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
                    <div class="profile__tertiary-text ms-font-m">{{strings.userId}}: ${storage.user}</div>
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
                            <textarea class="ms-TextField-field" [(ngModel)]="experimentationFlags"></textarea>
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

    configs = [
        { name: this.strings.production, value: 'production' },
        { name: this.strings.beta, value: 'insiders' },
        { name: this.strings.alpha, value: 'edge' },
    ];
    selectedConfig = '';

    showExperimentationFlags = false;
    experimentationFlags = '';

    constructor(
        private _effects: UIEffects
    ) { }

    ngAfterViewInit() {
        this.availableLanguages = getAvailableLanguages();
        this.currentChosenLanguage = getDisplayLanguage();
        this.originalLanguage = this.currentChosenLanguage;

        // User can only navigate to localhost if they've sideloaded local manifest
        let showLocalConfig = (environment.current.config.name === config.local.name ||
            /localhost/.test(window.localStorage.getItem(localStorageKeys.originEnvironmentUrl)));
        if (showLocalConfig) {
            this.configs.push({ name: config.local.editorUrl, value: 'local' });
        }

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
