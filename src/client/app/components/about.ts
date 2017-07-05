import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { environment, storageSize, storage } from '../helpers';
import {Strings, getAvailableLanguages, getDisplayLanguage, setDisplayLanguage } from '../strings';
import { UIEffects } from '../effects/ui';
let { config } = PLAYGROUND;

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
                        <select class="about__language-select ms-font-m" [(ngModel)]="currentChosenLanguage" (change)="setLanguage($event.target.value)">
                            <option *ngFor="let l of availableLanguages" [value]="l.value">{{l.name}}</option>
                        </select>
                    </div>
                    <div class="about__environment">
                        <span class="ms-font-m about__environment-text">{{config?.editorUrl}}</span>
                        <br/><label class="ms-font-m about__environment-text">${Strings().aboutSwitchEnvironment}</label>
                        <select class="about__environment-select ms-font-m" [(ngModel)]="selectedConfig" (ngModelChange)="changeConfig($event)">
                            <option *ngFor="let c of configs" [value]="c.name">{{c.value}}</option>
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

    cache = `
    ${Strings().aboutStorage}
    ${storageSize(localStorage, `playground_${environment.current.host}_snippets`, Strings().aboutSnippets)}
    ${storageSize(sessionStorage, 'playground_intellisense', Strings().aboutIntellisense)}
    `;

    config = {
        build: environment.current.build,
        editorUrl: environment.current.config.editorUrl,
    };

    strings = Strings();

    availableLanguages = [] as { name: string, value: string }[];
    currentChosenLanguage = '';
    originalLanguage = '';

    configs = [];
    selectedConfig = '';

    constructor(
        private _effects: UIEffects,
        private _changeDetector: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        this.availableLanguages = getAvailableLanguages();
        this.currentChosenLanguage = getDisplayLanguage();
        this.originalLanguage = this.currentChosenLanguage;
        this.configs.push(
            { name: 'production', value: 'Production' },
            { name: 'insiders', value: 'Beta' },
            { name: 'edge', value: 'Alpha' },
        );

        // user can only navigate to localhost if they've sideloaded local manifest
        if (environment.current.config.name === config['local'].name ||
            environment.current.config.editorUrl === window.localStorage.getItem('originEnvironment')) {
            this.configs.push({ name: 'local', value: config['local'].editorUrl });
        }

        this.selectedConfig = this.configs.find(c => c.name.toUpperCase() === environment.current.config.name).name;
    }

    okClicked() {
        if (this.currentChosenLanguage !== this.originalLanguage) {
            setDisplayLanguage(this.currentChosenLanguage);
            window.location.reload();
        }

        this.showChange.emit(false);
    }

    setLanguage(languageCode: string) {
        this.currentChosenLanguage = languageCode;
    }

    async changeConfig(newConfig: string) {
        if (config[newConfig] && config[newConfig].name !== environment.current.config.name) {
            let currentConfigName = environment.current.config.name.toLowerCase();
            let result = await this._effects.alert(
                this.strings.changeEnvironmentConfirm,
                `${this.strings.aboutSwitchEnvironment} ${this.configs.find(c => c.name === currentConfigName).value } to ${this.configs.find(c => c.name === this.selectedConfig).value }`,
                this.strings.okButtonLabel,
                this.strings.cancelButtonLabel
            );

            if (result === this.strings.cancelButtonLabel) {
                this.selectedConfig = this.configs.find(c => c.name === currentConfigName).name;
                this._changeDetector.detectChanges();
                return;
            }

            let originEnvironment = window.localStorage.getItem('originEnvironment');
            let newEnvironment = config[newConfig].editorUrl;
            if (originEnvironment) {
                window.location.href = originEnvironment + '?newEnvironment=' + encodeURIComponent(newEnvironment);
            } else {
                window.localStorage.setItem('environmentConfig', newEnvironment);
                window.location.href = newEnvironment + '?originEnvironment=' + encodeURIComponent(environment.current.config.editorUrl);
            }
        }
    }
}
