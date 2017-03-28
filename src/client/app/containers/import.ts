import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Snippet, GitHub } from '../actions';
import { AI, Strings } from '../helpers';
import { isEmpty } from 'lodash';

//strings are specified inline (not imported) for performance reasons

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link gallery__tab--icon" (click)="cancel()">
                        <i class="ms-Icon ms-Icon--GlobalNavButton"></i><span>{{strings.close}}</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link gallery__tab--icon gallery__tab--highlighted" (click)="new()">
                        <i class="ms-Icon ms-Icon--Add"></i><span>{{strings.newSnippetLabel}}</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'snippets'}" (click)="switch('snippets')">
                        <i class="ms-Icon ms-Icon--DocumentSet"></i><span>{{strings.mySnippetsLabel}}</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'samples'}" (click)="switch('samples')">
                        <i class="ms-Icon ms-Icon--Dictionary"></i><span>{{strings.samplesLabel}}</span>
                    </li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'import'}" (click)="switch('import')">
                        <i class="ms-Icon ms-Icon--Download"></i><span>{{strings.importLabel}}</span>
                    </li>
                </ul>
                <section class="gallery__tabs-container">
                    <section class="import-tab__section" [hidden]="view !== 'snippets'">
                        <h1 class="ms-font-xxl import__title">{{strings.mySnippetsLabel}}</h1>
                        <p class="ms-font-l import__subtitle">{{strings.mySnippetsDescription}}</p>
                        <collapse title="{{strings.localSnippetsLabel}}">
                            <gallery-list [current]="current$|async" [items]="snippets$|async" (select)="import($event)">
                                {{strings.noLocalSnippets}}
                            </gallery-list>
                        </collapse>
                        <collapse title="{{strings.sharedGistsLabel}}">
                            <gallery-list [items]="gists$|async" (select)="import($event, 'gist')">
                                <div [hidden]="(isLoggedIn$|async)">
                                    <p class="ms-font-m import__subtitle">{{strings.sharedGistsSignIn}}</p>
                                    <button class="ms-Button" (click)="login() ">
                                        <span class="ms-Button-label">{{strings.loginGithub}}</span>
                                    </button>
                                </div>
                                <div [hidden]="!(isLoggedIn$|async)">
                                    {{strings.noGistsMessage}}
                                </div>
                            </gallery-list>
                        </collapse>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'samples'">
                        <h1 class="ms-font-xxl import__title">{{strings.samplesTab}}</h1>
                        <p class="ms-font-l import__subtitle">{{strings.samplesDescription}}</p>
                        <gallery-list title="Microsoft" [items]="templates$|async" (select)="import($event, 'gist')">
                            {{strings.noSamplesMessage}}
                        </gallery-list>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'import'">
                        <h1 class="ms-font-xxl import__title">{{strings.importLabel}}</h1>
                        
                            <p class="ms-font-l import__subtitle">{{strings.importInstructions}} <b>{{strings.importButtonLabel}}</b>.</p>
                            <div class="ms-TextField import__field">
                                <label class="ms-Label">{{strings.importUrlLabel}}</label>
                                <input class="ms-TextField-field" type="text" [(ngModel)]="url" placeholder="{{strings.importUrlPlaceholder}}" >
                            </div>
                            
                        
                            <div class="ms-TextField ms-TextField--multiline import__field">
                                <label class="ms-Label">{{strings.importYamlLabel}}</label>
                                <textarea [(ngModel)]="snippet" class="ms-TextField-field"></textarea>
                            </div>
                        
                        <div class="ms-Dialog-actions ">
                            <div class="ms-Dialog-actionsRight ">
                                <button class="ms-Dialog-action ms-Button" (click)="import() ">
                                    <span class="ms-Button-label">{{strings.importButtonLabel}}</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </section>
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
            .subscribe(() => this._store.dispatch(new UI.ToggleImportAction(true)));
    }

    strings = Strings;
    show$ = this._store.select(fromRoot.getImportState);
    templates$ = this._store.select(fromRoot.getTemplates);
    gists$ = this._store.select(fromRoot.getGists);
    isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);
    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (isEmpty(snippets)) {
                this.switch();
                this._store.dispatch(new UI.ToggleImportAction(true));
            }
            return snippets;
        });

    switch(view = 'samples') {
        AI.trackPageView(view, `/import/${view}`).stop();
        this.view = view;
    }

    import(item?: ITemplate) {
        let data = null;
        let mode = null;
        switch (this.view) {
            case 'snippets':
                if (item.id) {
                    mode = Snippet.ImportType.OPEN;
                }
                else {
                    mode = Snippet.ImportType.GIST;
                }
                data = item.id || item.gist;
                break;

            case 'import':
                if (this.url) {
                    mode = Snippet.ImportType.URL;
                }
                else {
                    mode = Snippet.ImportType.YAML;
                }
                data = this.url || this.snippet;
                break;

            case 'samples':
                mode = Snippet.ImportType.SAMPLE;
                data = item.gist;
                break;
        }

        if (data == null || data.trim() === '') {
            return;
        }

        this._store.dispatch(new Snippet.ImportAction(mode, data));
        this.cancel();
    }

    login() {
        this._store.dispatch(new GitHub.LoginAction());
    }

    new() {
        this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.DEFAULT));
        this._store.dispatch(new UI.ToggleImportAction(false));
    }

    cancel() {
        this._store.dispatch(new UI.ToggleImportAction(false));
    }
}
