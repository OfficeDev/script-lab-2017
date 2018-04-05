import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { getGistUrl, environment, storage, outlookEndpoints } from '../helpers';
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

                <div *ngIf="inOutlook">
                    <label class="ms-fontWeight-semibold ms-fontColor-neutralPrimary">{{strings.extensionPointsLabel}}</label>
                    <ul class="ms-ChoiceFieldGroup-list">
                        <li>
                            <label class="container">
                                <span class="ms-Label">{{strings.mailRead}}</span>
                                <input type="checkbox" [(ngModel)]="MailRead"/>
                                <span class="checkmark"></span>
                            </label>
                        </li>
                        <li>
                            <label class="container">
                                <span class="ms-Label">{{strings.mailCompose}}</span>
                                <input type="checkbox" [(ngModel)]="MailCompose"/>
                                <span class="checkmark"></span>
                            </label>
                        </li>
                        <li>
                            <label class="container">
                                <span class="ms-Label">{{strings.appointmentOrganizer}}</span>
                                <input type="checkbox" [(ngModel)]="AppointmentOrganizer"/>
                                <span class="checkmark"></span>
                            </label>
                        </li>
                        <li>
                            <label class="container">
                                <span class="ms-Label">{{strings.appointmentAttendee}}</span>
                                <input type="checkbox" [(ngModel)]="AppointmentAttendee"/>
                                <span class="checkmark"></span>
                            </label>
                        </li>
                    </ul>
                </div>

                <div *ngIf="showGistUrl" class="ms-TextField">
                    <label class="ms-Label ms-fontWeight-semibold">{{strings.gistUrlLabel}}</label>
                    <a href="{{gistUrl}}" target="_blank">{{strings.gistUrlLinkLabel}}</a>
                </div>
                <br/>
            </div>
            <div class="ms-Dialog-actions">
                <div class="ms-Dialog-actionsRight">
                    <button [ngClass]="buttonClasses" (click)="saveDisabled ? null : dismiss.emit(true)">
                        <span class="ms-Button-label">{{strings.save}}</span>
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

    get buttonClasses() {
        return {
            'ms-Button ms-Button--primary': true,
            'is-disabled': this.saveDisabled,
        };
    }

    get showGistUrl() {
        if (!this.snippet.gist) {
            return false;
        }

        if (storage.current.profile && storage.current.profile.login) {
            if (storage.current.profile.login === this.snippet.gistOwnerId) {
                return true;
            }
        }

        return false;
    }

    get gistUrl() {
        return isNil(this.snippet.gist) ? null : getGistUrl(this.snippet.gist);
    }

    get viewModeGistUrl() {
        let host = this.snippet.host.toLowerCase();
        return `${environment.current.config.editorUrl}/#/view/${host}/gist/${this.snippet.gist}`;
    }

    // Outlook Specific tooling

    get inOutlook() {
        return this.snippet.host.toLowerCase() === 'outlook';
    }

    get MailRead() {
        if (this.snippet.endpoints === undefined) {
            return false;
        }
        return this.snippet.endpoints.indexOf(outlookEndpoints.MailRead) !== -1;
    }

    @Input()
    set MailRead(checked: boolean) {
        this.snippet.endpoints = this.snippet.endpoints ? this.snippet.endpoints : [];
        if (checked) {
            if (this.snippet.endpoints.indexOf(outlookEndpoints.MailRead) === -1) {
                this.snippet.endpoints.push(outlookEndpoints.MailRead);
            }
        } else {
            this.snippet.endpoints = this.snippet.endpoints.filter(endpoint => endpoint !== outlookEndpoints.MailRead);
        }
    }

    get MailCompose() {
        if (this.snippet.endpoints === undefined) {
            return false;
        }
        return this.snippet.endpoints.indexOf(outlookEndpoints.MailCompose) !== -1;
    }

    @Input()
    set MailCompose(checked: boolean) {
        this.snippet.endpoints = this.snippet.endpoints ? this.snippet.endpoints : [];
        if (checked) {
            if (this.snippet.endpoints.indexOf(outlookEndpoints.MailCompose) === -1) {
                this.snippet.endpoints.push(outlookEndpoints.MailCompose);
            }
        } else {
            this.snippet.endpoints = this.snippet.endpoints.filter(endpoint => endpoint !== outlookEndpoints.MailCompose);
        }
    }

    get AppointmentOrganizer() {
        if (this.snippet.endpoints === undefined) {
            return false;
        }
        return this.snippet.endpoints.indexOf(outlookEndpoints.AppointmentOrganizer) !== -1;
    }

    @Input()
    set AppointmentOrganizer(checked: boolean) {
        this.snippet.endpoints = this.snippet.endpoints ? this.snippet.endpoints : [];
        if (checked) {
            if (this.snippet.endpoints.indexOf(outlookEndpoints.AppointmentOrganizer) === -1) {
                this.snippet.endpoints.push(outlookEndpoints.AppointmentOrganizer);
            }
        } else {
            this.snippet.endpoints = this.snippet.endpoints.filter(endpoint => endpoint !== outlookEndpoints.AppointmentOrganizer);
        }
    }

    get AppointmentAttendee() {
        if (this.snippet.endpoints === undefined) {
            return false;
        }
        return this.snippet.endpoints.indexOf(outlookEndpoints.AppointmentAttendee) !== -1;
    }

    @Input()
    set AppointmentAttendee(checked: boolean) {
        this.snippet.endpoints = this.snippet.endpoints ? this.snippet.endpoints : [];
        if (checked) {
            if (this.snippet.endpoints.indexOf(outlookEndpoints.AppointmentAttendee) === -1) {
                this.snippet.endpoints.push(outlookEndpoints.AppointmentAttendee);
            }
        } else {
            this.snippet.endpoints = this.snippet.endpoints.filter(endpoint => endpoint !== outlookEndpoints.AppointmentAttendee);
        }
    }

    @Input()
    get saveDisabled() {
        // In outlook, at least one endpoint must be enabled, so we disable the save button unless at least one is checked.
        return this.inOutlook && !(this.MailRead || this.MailCompose || this.AppointmentAttendee || this.AppointmentOrganizer);
    }

}
