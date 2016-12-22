import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Monaco, Snippet } from '../actions';

@Component({
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'url'}" (click)="view = 'url'">From url</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'snippet'}" (click)="view = 'snippet'">From snippet</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'gist'}" (click)="view = 'gist'">From my gists</li>
                </ul>
                <div class="gallery__tabs-container">
                    <section class="tab__section">
                        <h1 class="ms-font-xxl">From url</h1>
                        <p class="ms-font-l">Paste the snippet's URL or ID into the text area below, and then choose the "Import" button.</p>
                        <div class="ms-TextField">
                            <label class="ms-Label">Url or gist id</label>
                            <input class="ms-TextField-field" type="text" value="" placeholder="Enter your url or gist id here" >
                        </div>

                        <p class="ms-font-m">Here are examples:</p>
                        <ol>
                            <li>https://gist.github.com/sampleGistId</li>
                            <li>https://addin-playground.azurewebsites.net/#/gist/sampleGistId</li>
                            <li>https://mywebsite.com/myfolder/mysnippet.yaml</li>
                            <li>Alternatively you can also input just a gist ID such as</li>
                            <li>sampleGistId</li>
                        </ol>
                    </section>
                    <section class="tab__section" [hidden]="view !== 'snippet'">
                        <h1 class="ms-font-xxl">From snippet</h1>
                        <p class="ms-font-l">Paste the snippet's URL into the text area below, and then choose the "Import" button.</p>
                        <p class="ms-font-m">Here are the list of valid urls:</p>
                    </section>
                    <section class="tab__section" [hidden]="view !== 'gist'">
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
    `,
    styles: [`
        .tab__section {
            padding: 15px;
        }
    `]
})
export class Import {
    constructor(private _store: Store<fromRoot.State>) {
    }

    show$ = this._store.select(fromRoot.getImportState);

    import() {
        this._store.dispatch(new Snippet.ImportAction(null));
        this.cancel();
    }

    cancel() {
        this._store.dispatch(new UI.ToggleImportAction(false));
    }
}
