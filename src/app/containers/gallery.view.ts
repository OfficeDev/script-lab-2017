import { Component } from '@angular/core';
import { UI, Snippet } from '../actions';
import { Disposable } from '../services';
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
                    <gallery-list title="Local" [current]="current$|async" [items]="snippets$|async" (select)="import($event)" fallback="You have no snippets. To get started, create a new snippet or use the import option to load a snippet from various sources."></gallery-list>
                </collapse>
            </section>
            <section class="gallery__section">
                <hr class="gallery__section--separator" />
                <button class="gallery__action ms-Button ms-Button--compound" (click)="new()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageAdd"></i>New</h1>
                    <span class="ms-Button-description">Create a new snippet.</span>
                </button>
                <button class="gallery__action button-primary ms-Button ms-Button--compound" (click)="import()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageCheckedOut"></i>Import</h1>
                    <span class="ms-Button-description">Create from GitHub Gist or YAML.</span>
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

    current$ = this._store.select(fromRoot.getCurrent);
    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (isEmpty(snippets)) {
                this._store.dispatch(new UI.OpenMenuAction());
            }
            return snippets;
        });

    new() {
        this._store.dispatch(new Snippet.ImportAction('default'));
        this._store.dispatch(new UI.CloseMenuAction());
    }

    import() {
        this._store.dispatch(new UI.ToggleImportAction(true));
    }

    async action(action: any) {
        if (action.title === 'Local') {
            switch (action.action) {
                case 'Info': {
                    await this._effects.alert(`Snippets are stored in your browser's "localStorage" and will disappear if you clear your browser cache.

                    In-order to retain permanent copies of your snippets please export them as gists via the 'Share' menu.`, `Info`, `Got it`);
                    return;
                }

                case 'Delete': {
                    let result = await this._effects.alert('Are you sure you want to delete all your local snippets?', `Delete local snippets`, `Yes, delete them`, 'No, keep them');
                    if (result === 'No, keep them') {
                        return;
                    }

                    return this._store.dispatch(new Snippet.DeleteAllAction());
                }
            }
        }
    }
}

