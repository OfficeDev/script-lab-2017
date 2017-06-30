import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { environment, storageSize, Strings, storage } from '../helpers';
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
                    <div class="profile__tertiary-text ms-font-m">User ID: ${storage.user}</div>
                    <div class="about__secondary-text ms-font-l">Version: {{config?.build?.version}}
                        <br/><span class="ms-font-m">(Deployed {{config?.build?.humanReadableTimestamp}})</span>
                    </div>
                    <pre class="about__tertiary-text ms-font-m">{{cache}}</pre>
                    <div class="about__environment">
                        <span class="ms-font-m about__environment-text">{{config?.editorUrl}}</span>
                        <br/><label class="ms-font-m about__environment-text">${Strings.aboutSwitchEnvironment}</label>
                        <select class="about__environment-select ms-font-m" [(ngModel)]="selectedConfig" (change)="changeConfig($event.target.value)">
                            <option *ngFor="let c of configs" [value]="c.name">{{c.value}}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="showChange.emit(false)">
                        <span class="ms-Button-label">${Strings.okButtonLabel}</span>
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
        Strings.aboutStorage,
        storageSize(localStorage, `playground_${environment.current.host}_snippets`, Strings.aboutSnippets),
        storageSize(sessionStorage, 'playground_intellisense', Strings.aboutIntellisense)
    ].join('\n');

    config = {
        build: environment.current.build,
        editorUrl: environment.current.config.editorUrl,
    };

    configs = [];

    selectedConfig = '';

    constructor(
        private _effects: UIEffects,
        private _changeDetector: ChangeDetectorRef
    ) { }

    ngAfterViewInit() {
        this.configs.push(
            { name: 'production', value: 'Production' },
            { name: 'insiders', value: 'Beta' },
            { name: 'edge', value: 'Alpha' },
        );
        if (environment.current.config.name === config['local'].name) {
            this.configs.push({ name: 'local', value: config['local'].editorUrl });
        }

        this.selectedConfig = this.configs.find(c => c.name.toUpperCase() === environment.current.config.name).name;
    }

    async changeConfig(newConfig: string) {
        if (config[newConfig] && config[newConfig].name !== environment.current.config.name) {
            let currentConfigName = environment.current.config.name.toLowerCase();
            let result = await this._effects.alert(
                Strings.changeEnvironmentConfirm,
                `${Strings.aboutSwitchEnvironment} ${this.configs.find(c => c.name === currentConfigName).value } to ${this.configs.find(c => c.name === this.selectedConfig).value }`,
                Strings.okButtonLabel,
                Strings.cancelButtonLabel
            );

            if (result === Strings.cancelButtonLabel) {
                this.selectedConfig = this.configs.find(c => c.name === currentConfigName).name;
                this._changeDetector.detectChanges();
                return;
            }

            let newUrl = config[newConfig].editorUrl;
            window.localStorage.setItem('environmentConfig', newUrl);
            window.location.href = newUrl + '?originEnvironment=' + encodeURIComponent(window.location.origin);
        }
    }
}
