import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'command',
  template: `
        <div class="command__icon ms-u-slideLeftIn10">
            <i [hidden]="async || !icon" class="ms-Icon" [ngClass]="icon"></i>
            <img class="command__image" *ngIf="image" [src]="image" />
            <div class="command__async" *ngIf="async === true"></div>
            <span class="ms-font-m ms-u-slideLeftIn10" *ngIf="!(title == null)">{{title}}</span>
        </div>
        <div class="command__dropdown">
            <ng-content></ng-content>
        </div>
    `,
})
export class Command {
  private _icon: string;

  @Input()
  get icon() {
    if (this._icon) {
      return `ms-Icon--${this._icon}`;
    } else {
      return '';
    }
  }

  set icon(value) {
    this._icon = value;
  }

  @Input() title: string;
  @Input() image: string;
  @Input() async: boolean;
}
