import { Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage, Utilities, HostTypes } from '@microsoft/office-js-helpers';
import { ViewBase } from '../shared/components/base';
import { Monaco, MonacoEvents, Snippet, SnippetManager, Notification } from '../shared/services';
import { Theme, PlaygroundError } from '../shared/helpers';
import * as _ from 'lodash';
import './editor.view.scss';

@Component({
    selector: 'editor-view',
    templateUrl: 'editor.view.html'
})
export class EditorView extends ViewBase implements OnInit, OnDestroy, OnChanges {
    snippet: Snippet;
    menuOpen = false;
    readonly = false;
    theme = 'vs';
    title: string = `${HostTypes[Utilities.host]} Snippets`;

    private _store: Storage<string>;

    constructor(
        private _location: Location,
        private _monaco: Monaco,
        private _snippets: SnippetManager,
        private _notification: Notification,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super();
        this._store = new Storage<string>('Playground');
    }

    ngOnInit() {
        let subscription = this._route.params.subscribe(async params => {
            try {
                if (_.isEmpty(params['store']) || _.isEmpty(params['id'])) {
                    let lastOpened = this._store.get('LastOpened');
                    let snippet = await this._snippets.find(lastOpened);
                    this.snippet = snippet;
                }
                else if (params['store'].toLowerCase() === 'local') {
                    this.snippet = await this._snippets.find(params['id']);
                }
                else {
                    // import from gist
                    this.readonly = true;
                }

                this._monaco.updateLibs('typescript', this.snippet.typings);
                this.save();
            }
            catch (error) {
                let result = await this._notification.confirm('Unable to find snippet. Do you want to create a new snippet?', 'Oops', 'Create', 'Cancel');
                if (result === 'Create') {
                    this.snippet = await this._snippets.new();
                    this._location.replaceState(`/local/${this.snippet.content.id}`);
                    this._monaco.updateLibs('typescript', this.snippet.typings);
                    this.save();
                }
            }
        });

        this.markDispose(subscription);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        if (!(changes['snippet'].currentValue == null)) {
            this._monaco.updateLibs('typescript', this.snippet.typings);
        }
    }

    async save() {
        try {
            this._store.insert('LastOpened', this.snippet.content.id);
            await this._snippets.save(this.snippet.content);
        }
        catch (error) {
            this._notification.confirm(error, 'Unable to save snippet', 'Ok');
        }
    }

    async run() {
        await this.save();
        await this._snippets.run(this.snippet.content);
    }

    interaction(event: MonacoEvents) {
        switch (event) {
            case MonacoEvents.SAVE:
                this.save();
                break;

            case MonacoEvents.TOGGLE_MENU:
                this.menuOpen = !this.menuOpen;
                break;

            case MonacoEvents.RUN:
                this.run();
        }
    }
}
