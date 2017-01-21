import { Component, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Theme, AI } from '../helpers';
import { UI, Snippet, GitHub } from '../actions';
import { Storage } from '@microsoft/office-js-helpers';
import { Disposable } from '../services';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { UIEffects } from '../effects/ui';
import * as _ from 'lodash';

@Component({
    selector: 'gallery',
    template: `
        <section class="gallery">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': !templatesView}" (click)="templatesView = false">Snippets</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': templatesView}" (click)="templatesView = true">Samples</li>
                </ul>
                <div class="gallery__tabs-container">
                    <collapse [hidden]="templatesView" title="Local" [actions]="['Info', 'Delete']" (events)="action($event)">
                        <gallery-list title="Local" [current]="current$|async" [items]="snippets$|async" (select)="import($event)" fallback="You have no local snippets. To get started, import one from a shared link or create a gallery snippet. You can also choose one from the Templates."></gallery-list>
                    </collapse>
                    <collapse [collapsed]="true" [hidden]="templatesView" title="Gists" (action)="action.emit($event)">
                        <gallery-list title="Local" [items]="gists$|async" (select)="import($event, 'gist')" fallback="You have no gists exported. To get started, create a new snippet and share it to your gists."></gallery-list>
                    </collapse>
                    <collapse [hidden]="!templatesView" title="Starter Samples" (action)="action.emit($event)">
                        <gallery-list [hidden]="!templatesView" title="Microsoft" [items]="templates$|async" (select)="import($event, 'gist')"></gallery-list>
                    </collapse>
                </div>
            </section>
            <section class="gallery__section">
                <hr class="gallery__section--separator" />
                <button class="gallery__action ms-Button ms-Button--compound" (click)="new()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageAdd"></i>New</h1>
                    <span class="ms-Button-description">Create a new snippet.</span>
                </button>
                <button class="gallery__action button-primary ms-Button ms-Button--compound" (click)="import()">
                    <h1 class="ms-Button-label"><i class="ms-Icon ms-Icon--PageCheckedOut"></i>Import</h1>
                    <span class="ms-Button-description">Create from GitHub GIST or YAML.</span>
                </button>
            </section>
        </section>
    `
})
export class Gallery extends Disposable {
    templatesView: boolean;

    constructor(
        private _store: Store<fromRoot.State>,
        private _effects: UIEffects,
    ) {
        super();

        this._store.dispatch(new Snippet.LoadSnippetsAction());
        this._store.dispatch(new Snippet.LoadTemplatesAction());
        this._store.dispatch(new GitHub.LoadGistsAction());
    }

    current$ = this._store.select(fromRoot.getCurrent);
    templates$ = this._store.select(fromRoot.getTemplates);
    gists$ = this._store.select(fromRoot.getGists);
    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (_.isEmpty(snippets)) {
                this._store.dispatch(new UI.OpenMenuAction());
                this.templatesView = true;
            }
            return snippets;
        });

    new() {
        this._store.dispatch(new Snippet.ImportAction('default'));
        this._store.dispatch(new UI.CloseMenuAction());
    }

    import(item?: ITemplate, mode = 'id') {
        if (item == null) {
            this._store.dispatch(new UI.ToggleImportAction(true));
        }
        else {
            AI.current.trackEvent(Snippet.SnippetActionTypes.IMPORT, { info: mode === 'id' ? item.id : item.gist });
            this._store.dispatch(new Snippet.ImportAction(mode === 'id' ? item.id : item.gist));
            this._store.dispatch(new UI.CloseMenuAction());
        }
    }

    async action(action: any) {
        if (action.title === 'Local') {
            switch (action.action) {
                case 'Info': {
                    let result = await this._effects.alert(`Snippets are stored in your browser's "localStorage" and will disappear if you clear your browser cache.

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

