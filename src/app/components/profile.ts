import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

@Component({
    selector: 'profile',
    template: `
        <dialog *ngIf="!(profile==null)" [show]="show">
            <div class="profile">
                <img class="profile__image" [src]="profile?.avatar_url">
                <div class="profile__details">
                    <div class="profile__primary-text ms-font-xxl">{{profile?.name}}</div>
                    <div class="profile__secondary-text ms-font-l">{{profile?.login}}</div>
                    <div class="profile__tertiary-text ms-font-m">{{profile?.bio}}</div>
                </div>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(false)">
                        <span class="ms-Button-label">Close</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(true)">
                        <span class="ms-Button-label">Sign Out</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

export class Profile {
    @Input() profile: IBasicProfile;
    @Input() show: boolean;
    @Output() dismiss = new EventEmitter<ISnippet>();

    constructor() {
    }
}
