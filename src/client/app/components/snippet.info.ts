import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { Strings } from '../helpers';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'snippet-info',
    template: `
        <dialog title="Info" *ngIf="!(snippet==null)" [show]="show">
            <div class="ms-Dialog-content">
                <div class="ms-TextField">
                    <label class="ms-Label">${Strings.nameLabel}</label>
                    <input class="ms-TextField-field ms-font-m" type="text" [(ngModel)]="snippet.name" placeholder="Name of the snippet" />
                </div>

                <div class="ms-TextField ms-TextField--multiline">
                    <label class="ms-Label">${Strings.descriptionLabel}</label>
                    <textarea class="ms-TextField-field ms-font-m" [(ngModel)]="snippet.description" placeholder="Description of the snippet"></textarea>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(true)">
                        <span class="ms-Button-label">${Strings.saveButtonLabel}</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(false)">
                        <span class="ms-Button-label">${Strings.cancelButtonLabel}</span>
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
}
