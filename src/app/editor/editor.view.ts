import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Disposable } from '../services';
import * as fromRoot from '../reducers';
import * as snippet from '../actions/snippet';
import * as _ from 'lodash';
import './editor.view.scss';

@Component({
    selector: 'editor-view',
    templateUrl: 'editor.view.html'
})
export class EditorView extends Disposable implements OnInit, OnDestroy {
    source: string;
    snippet: ISnippet;
    loading$: Observable<boolean>;
    readonly$: Observable<boolean>;

    constructor(
        private _store: Store<fromRoot.State>,
        private _location: Location,
        private _route: ActivatedRoute
    ) {
        super();
        this.loading$ = this._store.select(fromRoot.getLoading);
        this.readonly$ = this._store.select(fromRoot.getReadOnly);
        let subscription = this._store.select(fromRoot.getCurrent)
            .subscribe(snippet => {
                if (snippet == null) {
                    return;
                }

                this._location.replaceState(`/${this.source}/${snippet.id}`);
                this.snippet = snippet;
            });

        this.markDispose(subscription);
    }

    ngOnInit() {
        this._routerEvents();
    }

    save() {
        this._store.dispatch(new snippet.SaveAction(this.snippet));
    }

    run() {
        this.save();
        this._store.dispatch(new snippet.RunAction(this.snippet));
    }

    // switchTheme() {
    //     Theme.editorTheme = Theme.editorTheme === 'vs' ? 'vs-dark' : 'vs';
    //     this.theme = Theme.editorTheme;
    // }

    // about() {
    //     let message = `Version: ${this.info.full_version}\nDate: ${new Date(this.info.build)}\n\nUsage:\n${Utils.storageSize(localStorage, HostTypes[Utilities.host] + 'Snippets')}\n${Utils.storageSize(sessionStorage, 'IntellisenseCache')}`;
    //     let result = this._notification.showDialog(message, this.info.name, 'Ok');
    // }

    // editorEvents(event: MonacoEvents) {
    //     switch (event) {
    //         case MonacoEvents.SAVE:
    //             return this.save();

    //         case MonacoEvents.TOGGLE_MENU:
    //             this.menuOpen = !this.menuOpen;
    //             break;

    //         case MonacoEvents.RUN:
    //             return this.run();
    //     }
    // }

    private _routerEvents() {
        let subscription = this._route.params.subscribe(({id, source}) => {
            if (id == null) {
                return null;
            }
            this._store.dispatch(new snippet.ImportAction(id));
            this.source = source;
        });

        this.markDispose(subscription);
    }

    // private _snippetEvents() {
    //     let subscription = this._events.on<ISnippet>('GalleryEvents')
    //         .subscribe(event => {
    //             switch (event.action) {
    //                 case GalleryEvents.DELETE:
    //                     if (!(this.snippet == null) && this.snippet.content.id === event.data.id) {
    //                         this._snippetStore.lastOpened = null;
    //                         this.snippet = null;
    //                     }
    //                     break;

    //                 case GalleryEvents.DELETE_ALL:
    //                     this.snippet = null;
    //                     this._snippetStore.lastOpened = null;
    //                     break;

    //                 case GalleryEvents.IMPORT:
    //                 case GalleryEvents.CREATE:
    //                 case GalleryEvents.SELECT:
    //                     if (this.snippet && this.snippet.isUpdated) {
    //                         let result = this._notification.showDialog('Do you want to save your changes?', 'Unsaved Snippet', 'Save', 'Discard', 'Cancel');
    //                         if (result === 'Save') {
    //                             this.save();
    //                         }
    //                         else if (result === 'Cancel') {
    //                             return;
    //                         }
    //                     }

    //                     if (event.action === GalleryEvents.SELECT) {
    //                         this.snippet = new Snippet(event.data);
    //                     }
    //                     else if (event.action === GalleryEvents.IMPORT) {
    //                         this.snippet = this._createSnippet(event.data as string);
    //                     }
    //                     else if (event.action === GalleryEvents.CREATE) {
    //                         this.snippet = this._createSnippet();
    //                     }
    //                     else if (event.action === GalleryEvents.COPY) {
    //                         this.snippet = this._snippetStore.create('copy');
    //                     }
    //                     break;
    //             }
    //         });

    //     this.markDispose(subscription);
    // }

    // private _loadSnippet(id: string, store: string = 'last') {
    //     try {
    //         let newSnippet: Snippet;

    //         switch (store) {
    //             case 'gist':
    //                 newSnippet = this._snippetStore.import(id);
    //                 break;

    //             case 'local':
    //             default:
    //                 newSnippet = this._snippetStore.find(id);
    //                 break;
    //         }

    //         this._snippetStore.createOrUpdate(newSnippet.content);
    //         this._location.replaceState(`/local/${newSnippet.content.id}`);
    //         return newSnippet;
    //     }
    //     catch (error) {
    //         let result = this._notification.showDialog(`We couldn't find your ${store} snippet with the id ${id}.\n\nDo you want to create a new snippet instead?`, `The missing snippet`, 'Create', 'Cancel');
    //         if (result === 'Create') {
    //             return this._createSnippet();
    //         }
    //         else {
    //             this._snippetStore.lastOpened = null;
    //             return null;
    //         }
    //     };
    // }

    // private _createSnippet(content?: string) {
    //     let snippet = this._snippetStore.create(content);
    //     this._snippetStore.createOrUpdate(snippet.content);
    //     this._location.replaceState(`/local/${snippet.content.id}`);
    //     return snippet;
    // }
}
