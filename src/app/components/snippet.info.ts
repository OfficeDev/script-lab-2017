import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Component({
    selector: 'snippet-info',
    template: `
        <dialog title="Info" *ngIf="!(snippet==null)" [show]="show">
            <div class="ms-Dialog-content">
                <div class="ms-TextField">
                    <label class="ms-Label">Name</label>
                    <input class="ms-TextField-field" type="text" [(ngModel)]="snippet.name" placeholder="Name of the snippet" />
                </div>

                <div class="ms-TextField ms-TextField--multiline">
                    <label class="ms-Label">Name</label>
                    <textarea class="ms-TextField-field" [(ngModel)]="snippet.description" placeholder="Description of the snippet"></textarea>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(true)">
                        <i class="ms-Icon ms-Icon--Save"></i>
                        <span class="ms-Button-label">Save</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(false)">
                        <i class="ms-Icon ms-Icon--Cancel"></i>
                        <span class="ms-Button-label">Cancel</span>
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
