import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'gallery-list',
    template: `
        <section class="gallery-list ms-u-slideUpIn10" [hidden]="empty">
            <collapse [title]="title" [actions]="actions" (events)="action.emit($event)">
                <section class="gallery-list__group" *ngFor="let group of (groupedItems|keys)">
                    <h3 class="gallery-list__group-header ms-font-m" *ngIf="group?.key">{{group?.key}}</h3>
                    <section class="gallery-list__group">
                        <article class="gallery-list__item gallery-list__item--template ms-font-m" *ngFor="let item of group?.value" (click)="select.emit(item)">
                            <div class="name">{{item?.name}}</div>
                            <div class="description">{{item?.description}}</div>
                        </article>
                    </section>
                </section>
            </collapse>
        </section>
        <p class="gallery-list__message ms-font-m" [hidden]="!empty">{{fallback||'No items were found. Please try again later.'}}</p>
    `
})
export class GalleryList {
    @Input() items: any[];
    @Input() actionable: boolean;
    @Input() title: string;
    @Input() fallback: string;
    @Output() select = new EventEmitter<any>();
    @Output() action = new EventEmitter<any>();

    actions: string[];
    groupedItems: any;
    empty: boolean;

    ngOnChanges(changes) {
        if (changes['items']) {
            this.groupedItems = _.groupBy(changes['items'].currentValue, 'group');
            this.empty = _.isEmpty(this.groupedItems);
        }
        if (changes['actionable']) {
            if (changes['actionable'].currentValue) {
                this.actions = ['Info', 'Delete'];
            }
        }
    }
};
