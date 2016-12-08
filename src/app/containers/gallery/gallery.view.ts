import { Component, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Theme } from '../../helpers';
import { UI, Snippet } from '../../actions';
import { Storage } from '@microsoft/office-js-helpers';
import { Disposable } from '../../services';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../reducers';
import * as _ from 'lodash';
import './gallery.view.scss';

@Component({
    selector: 'gallery-view',
    templateUrl: 'gallery.view.html'
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
    }

    import(item?: ITemplate) {
        if (item == null) {
            // show the Import UI Here
        }
        else {
            this._store.dispatch(new Snippet.ImportAction(item.id || item.gist));
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
