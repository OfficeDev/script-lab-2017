import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'dialog',
    template: `
    <div class="ms-Dialog-center" [hidden]="!show">
        <div class="ms-Overlay" [ngClass]="{ 'is-visible': show }"></div>
        <div class="ms-Dialog ms-Dialog--lgHeader ms-u-fadeIn200" [ngClass]="{ 'is-open': show }">
            <div class="ms-Dialog-main">
                <div class="ms-Dialog-header">
                    <p [hidden]="title == null" class="ms-Dialog-title">{{ title }}</p>
                </div>
                <div class="ms-Dialog-inner">
                    <ng-content></ng-content>
                </div>
            </div>
        </div>
    </div>
`
})
export class Dialog {
    @Input() title: string;
    @Input() show: boolean;
}
