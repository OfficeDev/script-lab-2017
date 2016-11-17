import { Component, OnInit, ApplicationRef } from '@angular/core';
import { Storage } from '@microsoft/office-js-helpers';
import { SnippetManager, Snippet, Notification } from '../shared/services';
import { ViewBase } from '../shared/components/base';
import * as _ from 'lodash';
import './gallery.view.scss';

@Component({
    selector: 'gallery-view',
    templateUrl: 'gallery.view.html'
})
export class GalleryView extends ViewBase implements OnInit {
    snippets: ISnippet[] = [];
    templates: IPlaylist = {} as any;
    hideWarn: boolean;

    private _store: Storage<string>;

    constructor(
        private _appRef: ApplicationRef,
        private _snippets: SnippetManager,
        private _notification: Notification
    ) {
        super();
        this._store = new Storage<string>('Playground');
        this.hideWarn = this._store.get('LocalStorageWarn') as any || false;
    }

    async ngOnInit() {
        this.snippets = this._snippets.local();
        this.templates = await this._snippets.templates();
        let subscription = this._notification.on<ISnippet>('StorageEvent').subscribe(async items => {
            this.snippets = this._snippets.local();
            console.log(this.snippets.length);
        });

        this.markDispose(subscription);
    }

    async delete(snippet: ISnippet) {
        let result = await this._notification.showDialog('Are you sure you want to delete your snippet?', `Delete '${snippet.name}'`, 'Delete', 'Keep');
        if (result === 'Keep') {
            return;
        }
        await this._snippets.delete(snippet);
    }

    async deleteAll() {
        let result = await this._notification.showDialog('Are you sure you want to delete all your local snippets?', 'Delete All', 'Delete all', 'Keep them');
        if (result === 'Keep them') {
            return;
        }
        await this._snippets.deleteAll();
        this.snippets = [];
    }

    toggleWarn() {
        this.hideWarn = !this.hideWarn;
        this._store.insert('LocalStorageWarn', this.hideWarn as any);
    }

    new() {
        this._notification.emit<ISnippet>('SnippetEvents', null);
    }

    select(snippet: ISnippet) {
        this._notification.emit<ISnippet>('SnippetEvents', snippet);
    }

    async events($event: any) {
        if ($event.title === 'Local') {
            switch ($event.action) {
                case 'Info': return this.toggleWarn();
                case 'Delete': {
                    let result = await this._notification.showDialog('Are you sure you want to delete all your local snippets?', 'Delete Local Snippets?', 'Delete All', 'Cancel');
                    if (result === 'Delete All') {
                        this._snippets.deleteAll();
                    }
                }
            }
        }
    }
}
