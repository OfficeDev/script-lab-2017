import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { environment, storageSize, storage } from '../helpers';
import {Strings, getAvailableLanguages, getDisplayLanguage, setDisplayLanguage } from '../strings';

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
                    <br/><span class="ms-font-m">{{config?.editorUrl}}</span>
                    </div>
                    <pre class="about__tertiary-text ms-font-m">{{cache}}</pre>
                    <div class="about__language">
                        <select class="about__language-select ms-font-m" [(ngModel)]="currentLanguage" (change)="changeLanguage($event.target.value)">
                            <option *ngFor="let l of availableLanguages" [value]="l.value">{{l.name}}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="showChange.emit(false)">
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

    config = {
        build: environment.current.build,
        editorUrl: environment.current.config.editorUrl,
    };

    strings = Strings();

    availableLanguages = [] as { name: string, value: string }[];
    currentLanguage = '';

    ngAfterViewInit() {
        this.availableLanguages = getAvailableLanguages();
        this.currentLanguage = getDisplayLanguage();
    }

    cache = `
    ${Strings().aboutStorage}
    ${storageSize(localStorage, `playground_${environment.current.host}_snippets`, Strings().aboutSnippets)}
    ${storageSize(sessionStorage, 'playground_intellisense', Strings().aboutIntellisense)}
    `;

    changeLanguage(languageCode: string) {
        setDisplayLanguage(languageCode);

        window.location.reload();
    }
}
