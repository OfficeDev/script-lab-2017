import { Component } from '@angular/core';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Snippet, GitHub } from '../actions';
import isEmpty = require('lodash/isEmpty');

@Component({
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">

                    <li class="gallery__tab ms-Pivot-link gallery__tab--icon" (click)="cancel()">
                        <i class="ms-Icon ms-Icon--Cancel"></i><span>Close</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link gallery__tab--icon gallery__tab--highlighted" (click)="new()">
                        <i class="ms-Icon ms-Icon--Add"></i><span>New snippet</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'snippets'}" (click)="view = 'snippets'">
                        <i class="ms-Icon ms-Icon--DocumentSet"></i><span>Snippets</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'samples'}" (click)="view = 'samples'">
                        <i class="ms-Icon ms-Icon--Dictionary"></i><span>Samples</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'import'}" (click)="view = 'import'">
                        <i class="ms-Icon ms-Icon--Download"></i><span>Import</span>
                    </li>
                </ul>
                <div class="gallery__tabs-container">
                    <section class="import-tab__section" [hidden]="view !== 'snippets'">
                        <h1 class="ms-font-xxl import__title">Snippets</h1>
                        <p class="ms-font-l import__subtitle">Choose from the snippets that you have created.</p>
                        <collapse title="My local snippets">
                            <gallery-list [current]="current$|async" [items]="snippets$|async" (select)="import($event)">
                                You have no snippets. To get started, create a new snippet or use the import option to load a snippet from various sources.
                            </gallery-list>
                        </collapse>
                        <collapse title="My shared gists">
                            <gallery-list [items]="gists$|async" (select)="import($event, 'gist')">
                                <div [hidden]="(isLoggedIn$|async)">
                                    <p class="ms-font-m import__subtitle">Please sign in to GitHub so that we can get your playground gists.</p>
                                    <button class="ms-Button" (click)="login() ">
                                        <span class="ms-Button-label">Sign in to GitHub</span>
                                    </button>
                                </div>
                                <div [hidden]="!(isLoggedIn$|async)">
                                    You have no gists exported. To get started, create a new snippet and share it to your gists.
                                </div>
                            </gallery-list>
                        </collapse>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'samples'">
                        <h1 class="ms-font-xxl import__title">Samples</h1>
                        <p class="ms-font-l import__subtitle">Choose from one of the predefined samples below to get started.</p>
                        <gallery-list title="Microsoft" [items]="templates$|async" (select)="import($event, 'gist')">
                            There are currently no samples available for this host. Be sure to check back later.
                        </gallery-list>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'import'">
                        <h1 class="ms-font-xxl import__title">Import</h1>
                        <collapse title="Import using a snippet url">
                            <p class="ms-font-l import__subtitle">Paste the snippet's URL or ID into the text area below, and then choose the "Import" button.</p>
                            <div class="ms-TextField import__field">
                                <label class="ms-Label">Url or gist id</label>
                                <input class="ms-TextField-field" type="text" [(ngModel)]="url" placeholder="Enter your url or gist id here" >
                            </div>
                            <p class="ms-font-m import__examples">Here are examples:</p>
                            <ol class="ms-font-m import__examples-list">
                                <li>https://gist.github.com/sampleGistId</li>
                                <li>https://addin-playground.azurewebsites.net/#/gist/sampleGistId</li>
                                <li>https://mywebsite.com/myfolder/mysnippet.yaml</li>
                                <li>Alternatively you can also input just a gist ID such as</li>
                                <li>sampleGistId</li>
                            </ol>
                        </collapse>
                        <collapse title="Import using a snippet yaml" collapsed="false">
                            <p class="ms-font-l import__subtitle">Paste the snippet's yaml into the text area below, and then choose the "Import" button.</p>
                            <div class="ms-TextField ms-TextField--multiline import__field">
                                <label class="ms-Label">Snippet Yaml</label>
                                <textarea [(ngModel)]="snippet" class="ms-TextField-field"></textarea>
                            </div>
                        </collapse>
                        <div class="ms-Dialog-actions ">
                            <div class="ms-Dialog-actionsRight ">
                                <button class="ms-Dialog-action ms-Button" (click)="import() ">
                                    <span class="ms-Button-label">Import</span>
                                </button>
                            </div>

                        </div>
                    </section>
                </div>
            </section>

        </dialog>
    `
})
export class Import {
    view = 'snippets';
    url: string;
    snippet: string;

    constructor(private _store: Store<fromRoot.State>) {
        this._store.dispatch(new Snippet.LoadSnippetsAction());
        this._store.dispatch(new Snippet.LoadTemplatesAction());
        this._store.dispatch(new GitHub.LoadGistsAction());

        this._store.select(fromRoot.getCurrent)
            .filter(snippet => snippet == null)
            .do(() => this._store.dispatch(new UI.ToggleImportAction(true)))
            .subscribe();
    }

    show$ = this._store.select(fromRoot.getImportState);
    templates$ = this._store.select(fromRoot.getTemplates);
    gists$ = this._store.select(fromRoot.getGists);
    isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);

    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (isEmpty(snippets)) {
                this.view = 'samples';
                this._store.dispatch(new UI.ToggleImportAction(true));
            }
            return snippets;
        });

    import(item?: ITemplate) {
        let data = null;
        switch (this.view) {
            case 'snippets':
                data = item.id || item.gist;
                break;

            case 'import':
                data = this.url || this.snippet;
                break;

            case 'samples':
                data = item.gist;
                break;
        }

        if (data == null || data.trim() === '') {
            return;
        }

        this._store.dispatch(new Snippet.ImportAction(data));
        this.cancel();
    }

    login() {
        this._store.dispatch(new GitHub.LoginAction());
    }

    new() {
        this._store.dispatch(new Snippet.ImportAction('default'));
        this._store.dispatch(new UI.ToggleImportAction(false));
    }

    cancel() {
        this._store.dispatch(new UI.ToggleImportAction(false));
    }
}
