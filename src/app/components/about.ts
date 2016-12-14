import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Utilities } from '@microsoft/office-js-helpers';
import { Utilities as Utils } from '../helpers';
import { Config } from '../../environment';
import * as _ from 'lodash';

@Component({
    selector: 'about',
    template: `
        <dialog [show]="show">
            <div class="about">
                <div class="about__image"></div>
                <div class="about__details">
                    <div class="about__primary-text ms-font-xxl">{{config?.name}}</div>
                    <div class="about__secondary-text ms-font-l">Version: {{config?.full_version}}</div>
                    <pre class="about__tertiary-text ms-font-m">{{cache}}</pre>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="showChange.emit(false)">
                        <i class="ms-Icon ms-Icon--CheckMark"></i>
                        <span class="ms-Button-label">Ok</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

export class About {
    @Input() show: boolean;
    @Output() showChange = new EventEmitter<boolean>();
    config = Config.build;
    cache = `Storage Usage:\n${Utils.storageSize(localStorage, Utilities.host + ' Snippets')}\n${Utils.storageSize(sessionStorage, 'IntellisenseCache')}`;
}
