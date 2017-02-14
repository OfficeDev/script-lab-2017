import { Component } from '@angular/core';

import { UI, Snippet } from '../actions';
import { Strings } from '../helpers';

import { Disposable } from '../services';
import { AI } from '../helpers';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UIEffects } from '../effects/ui';
import isEmpty = require('lodash/isEmpty');

@Component({
    selector: 'gallery',
    template: `
        <section class="gallery">
            <section class="gallery__section">

                <collapse title="My snippets" [actions]="['Info', 'Delete']" (events)="action($event)">
                    <gallery-list title="Local" [current]="current$|async" [items]="snippets$|async" (select)="import($event)" fallback="${Strings.noSnippetsMessage}"></gallery-list>
                </collapse>

            </section>
            <section class="gallery__section">
                <hr class="gallery__section--separator" />
                <button class="gallery__action ms-Button ms-Button--compound" (click)="new()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageAdd"></i>New</h1>
                    <span class="ms-Button-description">${Strings.newSnippetDescription}</span>
                </button>
                <button class="gallery__action button-primary ms-Button ms-Button--compound" (click)="import()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageCheckedOut"></i>Import</h1>

                    <span class="ms-Button-description">${Strings.importDescription}</span>

                </button>
            </section>
        </section>
    `
})
export class Gallery extends Disposable {
    constructor(
        private _store: Store<fromRoot.State>,
        private _effects: UIEffects,
    ) {
        super();
        this._store.dispatch(new Snippet.LoadSnippetsAction());
    }

    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (isEmpty(snippets)) {
                this._store.dispatch(new UI.ToggleImportAction(true));
            }
            return snippets;
        });

    import(item?: ITemplate) {
        if (item == null) {
            this._store.dispatch(new UI.ToggleImportAction(true));
        }
        else {
            AI.trackEvent(Snippet.SnippetActionTypes.IMPORT, { info: item.id });
            this._store.dispatch(new Snippet.ImportAction(item.id));
            // this._store.dispatch(new UI.CloseMenuAction());
        }
    }

    async action(action: any) {
        if (action.title === 'My snippets') {
            switch (action.action) {
                case 'Info': {
                    await this._effects.alert(Strings.localStorageWarning, Strings.moreInfoButtonLabel, Strings.okButtonLabel);
                    return;
                }

                case 'Delete': {
                    let result = await this._effects.alert(Strings.deleteLocalSnippets, Strings.deleteLocalSnippetsTitle, Strings.delete, Strings.cancelButtonLabel);
                    if (result === Strings.cancelButtonLabel) {
                        return;
                    }

                    return this._store.dispatch(new Snippet.DeleteAllAction());
                }
            }
        }
    }
}

