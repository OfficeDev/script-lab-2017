import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'gallery-list',
    template: `
        <section class="gallery-list ms-u-slideUpIn10" [hidden]="items == null">
            <collapse [title]="title">
                <section class="gallery-list__group" *ngFor="let group of (items|keys)">
                    <h3 class="gallery-list__group-header ms-font-m" [hidden]="group?.key == null">{{group?.key}}</h3>
                    <section class="gallery-list__group">
                        <article class="gallery-list__item gallery-list__item--template ms-font-m" *ngFor="let item of group?.value" (click)="import.emit(item)">
                            <div class="name">{{item?.name}}</div>
                            <div class="description">{{item?.description}}</div>
                        </article>
                    </section>
                </section>
            </collapse>
        </section>
    `
})
export class GalleryList {
    @Input() items: any[];
    @Input() title: string;
    @Output() import = new EventEmitter<any>();

    ngOnChanges(changes) {
        console.info(changes);
    }
};
