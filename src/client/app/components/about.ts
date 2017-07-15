import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { environment, storageSize, Strings, storage } from '../helpers';

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
                    <br/><span class="ms-font-m">{{config?.editorUrl}}</span>
                    </div>
                    <pre class="about__tertiary-text ms-font-m">{{cache}}</pre>
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

export class About {
    @Input() show: boolean;
    @Output() showChange = new EventEmitter<boolean>();
    config = {
        build: environment.current.build,
        editorUrl: environment.current.config.editorUrl,
    };

    cache = `
    ${Strings.aboutStorage}
    ${storageSize(localStorage, `playground_${environment.current.host}_snippets`, Strings.aboutSnippets)}
    ${storageSize(sessionStorage, 'playground_intellisense', Strings.aboutIntellisense)}
    `;
}
