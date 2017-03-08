import { Component, Input, Output, EventEmitter } from '@angular/core';
import { groupBy, isEmpty } from 'lodash';

@Component({
    selector: 'gallery-list',
    template: `
        <section class="gallery-list ms-u-slideUpIn10" [hidden]="empty">
            <section class="gallery-list__group" *ngFor="let group of (groupedItems|keys)">
                <collapse [title]="group?.key">
                    <section class="gallery-list__group">
                        <article class="gallery-list__item gallery-list__item--template ms-font-m" *ngFor="let item of group?.value" (click)="select.emit(item)" [ngClass]="{'gallery-list__item--selected' : item?.id === current?.id}">
                            <div class="name">{{item?.name}}</div>
                            <div class="description">{{item?.description}}</div>
                        </article>
                    </section>
                </collapse>
            </section>
        </section>
        <div class="gallery-list__message ms-font-m" [hidden]="!empty"><ng-content></ng-content></div>
    `
})
export class GalleryList {
    @Input() items: any[];
    @Input() title: string;
    @Input() fallback: string;
    @Input() current: string;
    @Output() select = new EventEmitter<any>();

    groupedItems: any;
    empty: boolean;

    ngOnChanges(changes) {
        if (changes['items']) {
            this.groupedItems = groupBy(changes['items'].currentValue, 'group');
            this.empty = isEmpty(this.groupedItems);
        }
    }
};
