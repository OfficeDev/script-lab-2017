import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { environment, storageSize, storage } from '../helpers';
import {Strings, getAvailableLanguages, getDisplayLanguage, setDisplayLanguage } from '../strings';
import { UIEffects } from '../effects/ui';
let { config, PLAYGROUND_ORIGIN, PLAYGROUND_REDIRECT } = PLAYGROUND;

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'about',
    template: `
        <dialog [show]="show">
            <div class="about">
                <div class="about__image"></div>
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
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="okClicked()">
                        <span class="ms-Button-label">{{strings.okButtonLabel}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

export class About implements AfterViewInit {
    @Input() show: boolean;
    @Output() showChange = new EventEmitter<boolean>();

    cache = [
        `${Strings().aboutStorage}`,
        `${storageSize(localStorage, `playground_${environment.current.host}_snippets`, Strings().aboutSnippets)}`,
        `${storageSize(sessionStorage, 'playground_intellisense', Strings().aboutIntellisense)}`,
    ].join('\n');

    config = {
        build: environment.current.build,
    };

    strings = Strings();

    availableLanguages = [] as { name: string, value: string }[];
    currentChosenLanguage = '';
    originalLanguage = '';

    configs = [
        { name: this.strings.production, value: 'production' },
        { name: this.strings.beta, value: 'insiders' },
        { name: this.strings.alpha, value: 'edge' },
    ];
    selectedConfig = '';

    constructor(
        private _effects: UIEffects
    ) {}

    ngAfterViewInit() {
        this.availableLanguages = getAvailableLanguages();
        this.currentChosenLanguage = getDisplayLanguage();
        this.originalLanguage = this.currentChosenLanguage;

        // User can only navigate to localhost if they've sideloaded local manifest
        let showLocalConfig = (environment.current.config.name === config['local'].name || /localhost/.test(window.localStorage.getItem(PLAYGROUND_ORIGIN)));
        if (showLocalConfig) {
            this.configs.push({ name: config['local'].editorUrl, value: 'local' });
        }

        this.selectedConfig = this.configs.find(c => c.value.toUpperCase() === environment.current.config.name).value;
    }

    async okClicked() {
        if (this.currentChosenLanguage !== this.originalLanguage) {
            setDisplayLanguage(this.currentChosenLanguage);
            window.location.reload();
        }

        this.showChange.emit(false);

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
            this.strings.okButtonLabel,
            this.strings.cancelButtonLabel
        );
        if (changeEnvironmentResult === this.strings.cancelButtonLabel) {
            this.selectedConfig = this.configs.find(c => c.value === currentConfigName).value;
            return;
        }

        let originEnvironment = window.localStorage.getItem(PLAYGROUND_ORIGIN);
        let targetEnvironment = config[this.selectedConfig].editorUrl;

        // Add query string parameters to default editor URL
        if (originEnvironment) {
            window.location.href = `${originEnvironment}?targetEnvironment=${encodeURIComponent(targetEnvironment)}`;
        } else {
            window.localStorage.setItem(PLAYGROUND_REDIRECT, targetEnvironment);
            window.location.href = `${targetEnvironment}?originEnvironment=${encodeURIComponent(environment.current.config.editorUrl)}`;
        }
    }
}
