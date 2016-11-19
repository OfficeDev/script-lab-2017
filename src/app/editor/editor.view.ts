import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import { ViewBase } from '../shared/components/base';
import { MonacoEvents, Snippet, SnippetStore, Notification, Events, GalleryEvents } from '../shared/services';
import { Theme, PlaygroundError } from '../shared/helpers';
import * as _ from 'lodash';
import './editor.view.scss';

@Component({
    selector: 'editor-view',
    templateUrl: 'editor.view.html'
})
export class EditorView extends ViewBase implements OnInit, OnDestroy {
    theme: string;
    snippet: Snippet;
    menuOpen = false;
    readonly = false;
    activeTab: string;
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
        this.switchTheme();
        this._routerEvents();
        this._snippetEvents();
    }

    async save() {
        try {
            let result = await this._snippetStore.save(this.snippet.content);
            this.snippet.updateHash();
            return result;
        }
        catch (error) {
            return await this._notification.showDialog(error, 'Unable to save snippet', 'Ok');
        }
    }

    async run() {
        await this.save();
        return await this._snippetStore.run(this.snippet.content);
    }

    async switchTheme() {
        if (_.isEmpty(this.theme)) {
            this.theme = this._store.get('Theme') || 'vs';
        }
        else {
            this.theme = this.theme === 'vs' ? 'vs-dark' : 'vs';
        }
        return await this._store.insert('Theme', this.theme);
    }

    async editorEvents(event: MonacoEvents) {
        switch (event) {
            case MonacoEvents.SAVE:
                return await this.save();

            case MonacoEvents.TOGGLE_MENU:
                this.menuOpen = !this.menuOpen;
                break;

            case MonacoEvents.RUN:
                return await this.run();
        }
    }

    private _routerEvents() {
        let subscription = this._route.params.subscribe(async params => {
            let id = params['id'] || this._store.get('LastOpened');
            if (!_.isEmpty(id)) {
                this.snippet = await this._loadSnippet(id);
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
                        else if (event.action === GalleryEvents.CREATE) {
                            this.snippet = await this._createSnippet();
                        }
                        else if (event.action === GalleryEvents.COPY) {
                            // this.snippet = await this._snippetStore.create('copy');
                        }
                        break;
                }
            });

        this.markDispose(subscription);
    }

    private async _loadSnippet(id: string) {
        try {
            let newSnippet: Snippet;
            newSnippet = await this._snippetStore.find(id);
            this._store.insert('LastOpened', newSnippet.content.id);
            await this._snippetStore.save(newSnippet.content);
            this._location.replaceState(`/local/${newSnippet.content.id}`);
            return newSnippet;
        }
        catch (error) {
            let title = _.isEmpty(id) ? 'Create a snippet' : 'Unable to find snippet';
            let result = await this._notification.showDialog('Do you want to create a new snippet?', title, 'Create', 'Cancel');
            if (result === 'Create') {
                this._createSnippet();
            }
        }
    }

    private async _createSnippet() {
        try {
            let newSnippet = await this._snippetStore.create();
            this._store.insert('LastOpened', newSnippet.content.id);
            await this._snippetStore.save(newSnippet.content);
            this._location.replaceState(`/local/${newSnippet.content.id}`);
            return newSnippet;
        }
        catch (error) {

        }
    }
}
