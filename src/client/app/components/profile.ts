import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { Strings } from '../strings';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
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
                        <span class="ms-Button-label">{{strings.cancelButtonLabel}}</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button" (click)="dismiss.emit(true)">
                        <span class="ms-Button-label">{{strings.logoutButtonLabel}}</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})

// the buttons should be switched
export class Profile {
    @Input() profile: IBasicProfile;
    @Input() show: boolean;
    @Output() dismiss = new EventEmitter<ISnippet>();

    strings = Strings();
}
