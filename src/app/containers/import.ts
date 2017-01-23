import { Component } from '@angular/core';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Snippet } from '../actions';

@Component({
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'url'}" (click)="view = 'url'">From url</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'snippet'}" (click)="view = 'snippet'">From snippet</li>
                </ul>
                <div class="gallery__tabs-container">
                    <section class="import-tab__section" [hidden]="view !== 'url'">
                        <h1 class="ms-font-xxl import__title">From url</h1>
                        <p class="ms-font-l import__subtitle">Paste the snippet's URL or ID into the text area below, and then choose the "Import" button.</p>
                        <div class="ms-TextField import__field">
                            <label class="ms-Label">Url or gist id</label>
                            <input class="ms-TextField-field" type="text" [(ngModel)]="id" placeholder="Enter your url or gist id here" >
                        </div>
                        <p class="ms-font-m import__examples">Here are examples:</p>
                        <ol class="ms-font-m import__examples-list">
                            <li>https://gist.github.com/sampleGistId</li>
                            <li>https://addin-playground.azurewebsites.net/#/gist/sampleGistId</li>
                            <li>https://mywebsite.com/myfolder/mysnippet.yaml</li>
                            <li>Alternatively you can also input just a gist ID such as</li>
                            <li>sampleGistId</li>
                        </ol>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'snippet'">
                        <h1 class="ms-font-xxl import__title">From snippet</h1>
                        <p class="ms-font-l import__subtitle">Paste the snippet's yaml into the text area below, and then choose the "Import" button.</p>
                        <div class="ms-TextField ms-TextField--multiline import__field">
                            <label class="ms-Label">Snippet Yaml</label>
                            <textarea [(ngModel)]="snippet" class="ms-TextField-field"></textarea>
                        </div>
                    </section>
                </div>
            </section>
            <div class="ms-Dialog-actions ">
                <div class="ms-Dialog-actionsRight ">
                    <button class="ms-Dialog-action ms-Button " (click)="import() ">
                        <span class="ms-Button-label">Import</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button " (click)="cancel()">
                        <span class="ms-Button-label">Cancel</span>
                    </button>
                </div>
            </div>
        </dialog>
    `
})
export class Import {
    view = 'url';
    id: string;
    snippet: string;

    constructor(private _store: Store<fromRoot.State>) {
    }

    show$ = this._store.select(fromRoot.getImportState);

    import() {
        let data = this.view === 'url' ? this.id : this.snippet;
        if (data == null || data.trim() === '') {
            return;
        }

        this._store.dispatch(new Snippet.ImportAction(data));
        this.cancel();
    }

    cancel() {
        this._store.dispatch(new UI.ToggleImportAction(false));
    }
}
