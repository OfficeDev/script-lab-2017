import { Component, OnInit, ApplicationRef } from '@angular/core';
import { Storage } from '@microsoft/office-js-helpers';
import { SnippetStore, Snippet, Notification } from '../shared/services';
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
        private _snippetStore: SnippetStore,
        private _notification: Notification
    ) {
        super();
        this._store = new Storage<string>('Playground');
        this.hideWarn = this._store.get('LocalStorageWarn') as any || false;
    }

    async ngOnInit() {
        this.snippets = this._snippetStore.local();
        this.templates = await this._snippetStore.templates();
        let subscription = this._notification.on<ISnippet>('StorageEvent')
            .throttleTime(100)
            .subscribe(items => {
                this.snippets = this._snippetStore.local();
            });

        this.markDispose(subscription);
    }

    async delete(snippet: ISnippet) {
        let result = await this._notification.showDialog('Are you sure you want to delete your snippet?', `Delete '${snippet.name}'`, 'Delete', 'Keep');
        if (result === 'Keep') {
            return;
        }
        if (this._store.get('LastOpened') === snippet.id) {
            return await this._store.remove('LastOpened');
        }

        return await this._snippetStore.delete(snippet);
    }

    async deleteAll() {
        let result = await this._notification.showDialog('Are you sure you want to delete all your local snippets?', 'Delete All', 'Delete all', 'Keep them');
        if (result === 'Keep them') {
            return;
        }
        await this._snippetStore.clear();
        return await this._store.remove('LastOpened');
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
                case 'Delete': return await this.deleteAll();
            }
        }
    }
}
