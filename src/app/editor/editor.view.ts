import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import { MonacoEvents, Snippet, SnippetStore, Notification, Events, GalleryEvents, Disposable } from '../shared/services';
import { PlaygroundError, Theme, Utilities as Utils } from '../shared/helpers';
import * as _ from 'lodash';
import './editor.view.scss';
declare let PLAYGROUND: any;

@Component({
    selector: 'editor-view',
    templateUrl: 'editor.view.html'
})
export class EditorView extends Disposable implements OnInit, OnDestroy {
    theme: string = Theme.editorTheme;
    snippet: Snippet;
    menuOpen = true;
    readonly = false;
    activeTab: string;
    info: any = PLAYGROUND.INFO;
    title: string = `${HostTypes[Utilities.host]} Snippets`;

    private _store: Storage<string>;

    constructor(
        private _location: Location,
        private _snippetStore: SnippetStore,
        private _notification: Notification,
        private _events: Events,
        private _route: ActivatedRoute
    ) {
        super();
        this._store = new Storage<string>('Playground');
    }

    ngOnInit() {
        this._routerEvents();
        this._snippetEvents();
    }

    async save() {
        try {
            this.snippet.updateHash();
            let result = await this._snippetStore.save(this.snippet.content);
            return result;
        }
        catch (error) {
            this._notification.showDialog(error, 'Unable to save snippet', 'Ok');
        };
    }

    async run() {
        await this.save();
        this._snippetStore.run(this.snippet.content);
    }

    switchTheme() {
        Theme.editorTheme = Theme.editorTheme === 'vs' ? 'vs-dark' : 'vs';
        this.theme = Theme.editorTheme;
    }

    async about() {
        let message = `Version: ${this.info.full_version}\nDate: ${new Date(this.info.build)}\n\nUsage:\n${Utils.storageSize(localStorage, HostTypes[Utilities.host] + 'Snippets')}\n${Utils.storageSize(sessionStorage, 'IntellisenseCache')}`;
        let result = await this._notification.showDialog(message, this.info.name, 'Ok');
    }

    editorEvents(event: MonacoEvents) {
        switch (event) {
            case MonacoEvents.SAVE:
                return this.save();

            case MonacoEvents.TOGGLE_MENU:
                this.menuOpen = !this.menuOpen;
                break;

            case MonacoEvents.RUN:
                return this.run();
        }
    }

    private _routerEvents() {
        let subscription = this._route.params.subscribe(async params => {
            let id: string = params['id'] || this._store.get('LastOpened');
            if (!_.isEmpty(id)) {
                this.snippet = await this._loadSnippet(id, params['store']);
            }
        });

        this.markDispose(subscription);
    }

    private _snippetEvents() {
        let subscription = this._events.on<ISnippet>('GalleryEvents')
            .subscribe(async event => {
                switch (event.action) {
                    case GalleryEvents.DELETE:
                        if (!(this.snippet == null) && this.snippet.content.id === event.data.id) {
                            if (this._store.contains('LastOpened')) {
                                this._store.remove('LastOpened');
                            }
                            this.snippet = null;
                        }
                        break;

                    case GalleryEvents.DELETE_ALL:
                        this.snippet = null;
                        if (this._store.contains('LastOpened')) {
                            this._store.remove('LastOpened');
                        }
                        break;

                    case GalleryEvents.IMPORT:
                    case GalleryEvents.CREATE:
                    case GalleryEvents.SELECT:
                        if (this.snippet && this.snippet.isUpdated) {
                            let result = await this._notification.showDialog('Do you want to save your changes?', 'Unsaved Snippet', 'Save', 'Discard', 'Cancel');
                            if (result === 'Save') {
                                this.save();
                            }
                            else if (result === 'Cancel') {
                                return;
                            }
                        }

                        if (event.action === GalleryEvents.SELECT) {
                            this.snippet = new Snippet(event.data);
                        }
                        else if (event.action === GalleryEvents.IMPORT) {
                            this.snippet = await this._loadSnippet(event.data as string, 'gist');
                        }
                        else if (event.action === GalleryEvents.CREATE) {
                            this.snippet = await this._createSnippet();
                        }
                        else if (event.action === GalleryEvents.COPY) {
                            this.snippet = await this._snippetStore.create('copy');
                        }
                        break;
                }
            });

        this.markDispose(subscription);
    }

    private async _loadSnippet(id: string, store: string = 'local') {
        try {
            let newSnippet: Snippet;

            if (store === 'local') {
                newSnippet = await this._snippetStore.find(id);
            }
            else if (store === 'gist') {
                newSnippet = await this._snippetStore.import(id);
            }

            this._store.insert('LastOpened', newSnippet.content.id);
            this._snippetStore.save(newSnippet.content);
            this._location.replaceState(`/local/${newSnippet.content.id}`);
            return newSnippet;
        }
        catch (error) {
            let result = await this._notification.showDialog('Do you want to create a new snippet?', 'Unable to find snippet', 'Create', 'Cancel');
            if (result === 'Create') {
                return this._createSnippet();
            }
        };
    }

    private async _createSnippet() {
        let snippet = await this._snippetStore.create();
        this._store.insert('LastOpened', snippet.content.id);
        await this._snippetStore.save(snippet.content);
        this._location.replaceState(`/local/${snippet.content.id}`);
        return snippet;
    }
}
