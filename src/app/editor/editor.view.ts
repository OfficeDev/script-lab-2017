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
    theme: string;
    snippet: Snippet;
    menuOpen = false;
    readonly = false;
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
        this.switchTheme();
        let subscription = this._route.params.subscribe(async params => {
            try {
                if (_.isEmpty(params['store'])) {
                    // default path, the user wants to create a new snippet.
                    let lastOpened = this._store.get('LastOpened');
                    if (_.isEmpty(lastOpened)) {
                        this.snippet = await this._snippets.new();
                    }
                    else {
                        this.snippet = await this._snippets.find(lastOpened);
                    }
                    this._location.replaceState(`/local/${this.snippet.content.id}`);
                }
                else if (params['store'].toLowerCase() === 'local') {
                    // if the user correctly provides a path and an id
                    this.snippet = await this._snippets.find(params['id']);
                    this._store.insert('LastOpened', this.snippet.content.id);
                }
                else {
                    // if the user wishes to import from a gist
                    this.readonly = true;
                }

                this._monaco.updateLibs('typescript', this.snippet.typings);
            }
            catch (error) {
                let result = await this._notification.confirm('Unable to find snippet. Do you want to create a new snippet instead?', 'Oops', 'Create', 'Cancel');
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

    async switchTheme() {
        if (_.isEmpty(this.theme)) {
            this.theme = this._store.get('Theme') || 'vs';
        }
        else {
            this.theme = this.theme === 'vs' ? 'vs-dark' : 'vs';
        }
        this._store.insert('Theme', this.theme);
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
