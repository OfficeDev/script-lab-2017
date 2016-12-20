import { Component, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Theme } from '../helpers';
import { UI, Snippet } from '../actions';
import { Storage } from '@microsoft/office-js-helpers';
import { Disposable } from '../services';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as _ from 'lodash';

@Component({
    selector: 'gallery-view',
    template: `
        <section class="gallery">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': !templatesView}" (click)="templatesView = false">Snippets</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': templatesView}" (click)="templatesView = true">Templates</li>
                </ul>
                <div class="gallery__tabs-container">
                    <gallery-list [hidden]="templatesView" title="Local" [items]="snippets$|async" (select)="import($event)" fallback="You have no local snippets. To get started, import one from a shared link or create a gallery snippet. You can also choose one from the Templates."
                        actionable="true" (action)="action($event)"></gallery-list>
                    <gallery-list [hidden]="!templatesView" title="Microsoft" [items]="templates$|async" (select)="import($event)"></gallery-list>
                </div>
            </section>
            <section class="gallery__section">
                <hr class="gallery__section--separator" />
                <button class="gallery__action ms-Button ms-Button--compound" (click)="new()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--Generate"></i>New</h1>
                    <span class="ms-Button-description">Create a new snippet.</span>
                </button>
                <button class="gallery__action button-primary ms-Button ms-Button--compound" (click)="import()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--Download"></i>Import</h1>
                    <span class="ms-Button-description">Create from GIST or JSON.</span>
                </button>
            </section>
        </section>
    `
})
export class GalleryView extends Disposable {
    templatesView: boolean;
    snippets$: Observable<ISnippet[]>;
    templates$: Observable<ITemplate[]>;

    constructor(private _store: Store<fromRoot.State>) {
        super();

        this.snippets$ = this._store.select(fromRoot.getSnippets)
            .map(snippets => {
                if (_.isEmpty(snippets)) {
                    this._store.dispatch(new UI.OpenMenuAction());
                    this.templatesView = true;
                }
                return snippets;
            });

        this.templates$ = this._store.select(fromRoot.getTemplates);

        this._store.dispatch(new Snippet.LoadSnippets());
        this._store.dispatch(new Snippet.LoadTemplates());
    }

    new() {
        this._store.dispatch(new Snippet.ImportAction('default'));
        this._store.dispatch(new UI.CloseMenuAction());
    }

    import(item?: ITemplate) {
        if (item == null) {
            this._store.dispatch(new UI.ToggleImportAction(true));
        }
        else {
            this._store.dispatch(new Snippet.ImportAction(item.id || item.gist));
            this._store.dispatch(new UI.CloseMenuAction());
        }
    }

    action(action: any) {
        if (action.title === 'Local') {
            switch (action.action) {
                case 'Delete': return this._store.dispatch(new Snippet.DeleteAllAction());
            }
        }
    }
}
