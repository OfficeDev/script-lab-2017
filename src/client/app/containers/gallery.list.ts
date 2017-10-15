import * as moment from 'moment';
import { groupBy, isEmpty } from 'lodash';
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { setUpMomentJsDurationDefaults } from '../helpers';
import { Strings, getDisplayLanguageOrFake } from '../strings';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'gallery-list',
    template: `
        <section class="gallery-list ms-u-slideUpIn10" [hidden]="empty">
            <section class="gallery-list__group" *ngFor="let group of (groupedItems|keys)">
                <collapse [title]="group?.key">
                    <section class="gallery-list__group">
                        <article class="gallery-list__item gallery-list__item--template ms-font-m"
                            *ngFor="let item of group?.value"
                            (mouseover)="setLastUpdatedText(item)"
                            [title]="item.lastUpdatedText"
                            (click)="select.emit(item)"
                            [ngClass]="{'gallery-list__item--selected' : item?.id === selected}"
                        >
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
    @Input() selected: string;
    @Output() select = new EventEmitter<any>();

    groupedItems: any;
    empty: boolean;

    constructor() {
        setUpMomentJsDurationDefaults(moment);
    }

    ngOnChanges(changes) {
        if (changes['items']) {
            this.groupedItems = groupBy(changes['items'].currentValue, 'group');
            this.empty = isEmpty(this.groupedItems);
        }
    }

    setLastUpdatedText(item: ISnippet): void {
        const momentText = moment(item.modified_at).locale(getDisplayLanguageOrFake()).fromNow();
        (item as any).lastUpdatedText = item.modified_at ? `${Strings().HtmlPageStrings.lastUpdated} ${momentText}` : '';
    }

};
