import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ViewBase } from '../base';
import './panel.scss';

@Component({
    selector: 'panel',
    template: `
        <div #panel class="panel ms-u-slideDownIn20" [hidden]="!open">
            <h4 class="panel__title ms-font-l">{{title}}</h4>
            <ng-content></ng-content>
        </div>
    `
})
export class Panel extends ViewBase {
    @Input() title: string;
    @Input() open: boolean;
    @Output() openChange: EventEmitter<boolean> = new EventEmitter<boolean>();
}
