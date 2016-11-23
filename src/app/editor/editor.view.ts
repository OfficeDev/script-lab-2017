import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import { MonacoEvents, Snippet, SnippetStore, Notification, Events, GalleryEvents, Disposable } from '../shared/services';
import { PlaygroundError, Theme } from '../shared/helpers';
import * as _ from 'lodash';
import './editor.view.scss';

@Component({
    selector: 'editor-view',
    templateUrl: 'editor.view.html'
})
export class EditorView extends Disposable implements OnInit, OnDestroy {
    theme: string = Theme.editorTheme;
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
        this._routerEvents();
        this._snippetEvents();
    }

    save() {
        return this._snippetStore
            .save(this.snippet.content)
            .then(result => this.snippet.updateHash())
            .catch(error => this._notification.showDialog(error, 'Unable to save snippet', 'Ok'));
    }

    run() {
        return this.save().then(() => this._snippetStore.run(this.snippet.content));
    }

    switchTheme() {
        Theme.editorTheme = Theme.editorTheme === 'vs' ? 'vs-dark' : 'vs';
        this.theme = Theme.editorTheme;
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
        let subscription = this._route.params.subscribe(params => {
            let id: string = params['id'] || this._store.get('LastOpened');
            if (!_.isEmpty(id)) {
                this._loadSnippet(id).then(snippet => {
                    this.snippet = snippet;
                });
            }
        });

        this.markDispose(subscription);
    }

    private _snippetEvents() {
        let subscription = this._events.on<ISnippet>('GalleryEvents')
            .subscribe(event => {
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
                            this._notification.showDialog('Do you want to save your changes?', 'Unsaved Snippet', 'Save', 'Discard', 'Cancel')
                                .then(result => {
                                    if (result === 'Save') {
                                        this.save();
                                    }
                                    else if (result === 'Cancel') {
                                        return;
                                    }
                                });
                        }

                        if (event.action === GalleryEvents.SELECT) {
                            this.snippet = new Snippet(event.data);
                        }
                        else if (event.action === GalleryEvents.CREATE) {
                            this._createSnippet().then(snippet => this.snippet = snippet);
                        }
                        else if (event.action === GalleryEvents.COPY) {
                            this._snippetStore.create('copy').then(snippet => this.snippet = snippet);
                        }
                        break;
                }
            });

        this.markDispose(subscription);
    }

    private _loadSnippet(id: string) {
        return this._snippetStore.find(id)
            .then(snippet => {
                let newSnippet = snippet;
                this._store.insert('LastOpened', newSnippet.content.id);
                this._snippetStore.save(newSnippet.content);
                this._location.replaceState(`/local/${newSnippet.content.id}`);
                return newSnippet;
            })
            .catch(error => {
                let title = _.isEmpty(id) ? 'Create a snippet' : 'Unable to find snippet';
                return this._notification.showDialog('Do you want to create a new snippet?', title, 'Create', 'Cancel')
                    .then(result => {
                        if (result === 'Create') {
                            return this._createSnippet();
                        }
                    });
            });
    }

    private _createSnippet() {
        let newSnippet: Snippet;
        return this._snippetStore.create()
            .then(snippet => {
                newSnippet = snippet;
                this._store.insert('LastOpened', newSnippet.content.id);
                return this._snippetStore.save(newSnippet.content);
            })
            .then(snippet => {
                this._location.replaceState(`/local/${newSnippet.content.id}`);
                return newSnippet;
            });
    }
}
