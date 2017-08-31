import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { getGistUrl, environment } from '../helpers';
import { Strings } from '../strings';
import { isNil } from 'lodash';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'snippet-info',
    template: `
        <dialog title="{{strings.snippetInfoDialogTitle}}" *ngIf="!(snippet==null)" [show]="show">
            <div class="ms-Dialog-content">
                <div class="ms-TextField">
                    <label class="ms-Label">{{strings.nameLabel}}</label>
                    <input class="ms-TextField-field ms-font-m" type="text" [(ngModel)]="snippet.name" placeholder="{{strings.namePlaceholder}}" />
                </div>

                <div class="ms-TextField ms-TextField--multiline">
                    <label class="ms-Label">{{strings.descriptionLabel}}</label>
                    <textarea class="ms-TextField-field ms-font-m" [(ngModel)]="snippet.description" placeholder="{{strings.descriptionPlaceholder}}"></textarea>
                </div>

                <div *ngIf="!!gistUrl" class="ms-TextField">
                    <label class="ms-Label">{{strings.gistUrlLabel}}</label>
                    <a href="{{gistUrl}}" target="_blank">{{strings.gistUrlLinkLabel}}</a>
                </div>

                <div *ngIf="!!gistUrl" class="ms-TextField ms-TextField--multiline">
                    <label class="ms-Label">{{strings.viewModeGistUrlLabel}}</label>
                    <textarea readonly class="ms-TextField-field ms-font-m" [(ngModel)]="viewModeGistUrl"></textarea>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(true)">
                        <span class="ms-Button-label">{{strings.saveButtonLabel}}</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(false)">
                        <span class="ms-Button-label">{{strings.cancelButtonLabel}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

export class SnippetInfo {
    @Input() snippet: ISnippet;
    @Input() show: boolean;
    @Output() dismiss = new EventEmitter<ISnippet>();

    strings = Strings();

    get gistUrl() {
        return isNil(this.snippet.gist) ? null : getGistUrl(this.snippet.gist);
    }

    get viewModeGistUrl() {
        let host = this.snippet.host.toLowerCase();
        return `${environment.current.config.editorUrl}/#/view/gist/${host}/${this.snippet.gist}`;
    }
}
