import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
        private _snippets: SnippetManager,
        private _notification: Notification,
        private _router: Router
    ) {
        super();
        this._store = new Storage<string>('Playground');
        this.hideWarn = this._store.get('LocalStorageWarn') as any || false;
    }

    async ngOnInit() {
        this.snippets = await this._snippets.local();
        this.templates = await this._snippets.templates();
    }

    async delete(snippet: ISnippet) {
        await this._snippets.delete(snippet);
        this.snippets = await this._snippets.local();
    }

    async deleteAll() {
        await this._snippets.deleteAll();
        this.snippets = await this._snippets.local();
    }

    toggleWarn() {
        this.hideWarn = !this.hideWarn;
        this._store.insert('LocalStorageWarn', this.hideWarn as any);
    }

    new() {
        this._router.navigate(['']);
    }

    select(snippet: ISnippet) {
        this._router.navigate(['local', snippet.id]);
    }

    async events($event: any) {
        if ($event.title === 'Local') {
            switch ($event.action) {
                case 'Info': return this.toggleWarn();
                case 'Delete': {
                    let result = await this._notification.confirm('Are you sure you want to delete all your local snippets?', 'Delete Local Snippets?', 'Delete All', 'Cancel');
                    if (result === 'Delete All') {
                        this._snippets.deleteAll();
                    }
                }
            }
        }
    }
}
