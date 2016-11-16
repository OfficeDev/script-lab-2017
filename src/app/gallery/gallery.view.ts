import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SnippetManager, Snippet, Mediator, EventChannel } from '../shared/services';
import { ViewBase } from '../shared/components/base';
import * as _ from 'lodash';
import './gallery.view.scss';

@Component({
    selector: 'gallery-view',
    templateUrl: 'gallery.view.html'
})
export class GalleryView extends ViewBase implements OnInit {
    snippets: ISnippet[] = [];
    playlist: IPlaylist = {} as any;
    channel: EventChannel<boolean>;

    constructor(
        private _snippets: SnippetManager,
        private _mediator: Mediator,
        private _router: Router
    ) {
        super();
        this.channel = this._mediator.createEventChannel<boolean>('ImportSnippet');
    }

    async ngOnInit() {
        this.snippets = await this._snippets.local();
        this.playlist = await this._snippets.playlist();
    }

    async delete(snippet: ISnippet) {
        await this._snippets.delete(snippet);
        this.snippets = await this._snippets.local();
    }

    async deleteAll() {
        await this._snippets.deleteAll();
        this.snippets = await this._snippets.local();
    }

    select(snippet: ISnippet) {
        this._router.navigate(['local', snippet.id]);
    }

    showImport() {
        this.channel.event.emit(true);
    }
}
