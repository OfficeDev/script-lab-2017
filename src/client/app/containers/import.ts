import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Snippet, GitHub } from '../actions';
import { environment, AI, storage, isInsideOfficeApp, trustedSnippetManager } from '../helpers';
import { Request, ResponseTypes } from '../services';
import { Strings } from '../strings';
import { Subscription } from 'rxjs/Subscription';
import { isEmpty } from 'lodash';

const SNIPPET_TO_IMPORT_PROPERTY_NAME = 'SnippetToImport';
const CORRELATION_ID_PROPERTY_NAME = 'CorrelationId';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link gallery__tab--icon" (click)="cancel()">
                        <i class="ms-Icon ms-Icon--GlobalNavButton"></i><span></span>
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
                        <i class="ms-Icon ms-Icon--Download"></i><span>{{strings.importButtonLabel}}</span>
                    </li>
                </ul>
                <section class="gallery__tabs-container">
                    <section class="import-tab__section" [hidden]="view !== 'snippets'">
                        <h1 class="ms-font-xxl import__title">{{strings.mySnippetsLabel}}</h1>
                        <p class="ms-font-l import__subtitle">{{strings.mySnippetsDescription}}</p>
                        <collapse title="{{strings.localSnippetsLabel}}">
                            <div *ngIf="showLocalStorageWarning" class="ms-MessageBar ms-MessageBar--warning">
                                <div class="ms-MessageBar-content">
                                    <div class="ms-MessageBar-icon">
                                        <i class="ms-Icon ms-Icon--Warning"></i>
                                    </div>
                                    <div class="ms-MessageBar-text">
                                        {{strings.localStorageWarning}}
                                        <br />
                                        <a href="javascript:void(0);" (click)="hideLocalStorageWarning()" class="ms-Link">{{strings.localStorageWarningAction}}</a> 
                                    </div>
                                </div>
                            </div>
                            <gallery-list [selected]="activeSnippetId" [items]="snippets$|async" (select)="import($event)">
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
                        <div class="ms-TextField ms-TextField--multiline import__field">
                            <label class="ms-Label">{{strings.importUrlOrYamlLabel}}</label>
                            <textarea class="ms-TextField-field" [(ngModel)]="urlOrSnippet" placeholder="{{strings.importUrlPlaceholder}}" ></textarea>
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
    urlOrSnippet: string;
    showLocalStorageWarning: boolean;
    activeSnippetId: string;

    strings = Strings();

    private snippetSub: Subscription;

    constructor(
        private _request: Request,
        private _store: Store<fromRoot.State>
    ) {
        trustedSnippetManager.cleanUpTrustedSnippets();
        this._store.dispatch(new Snippet.LoadSnippetsAction());
        this._store.dispatch(new Snippet.LoadTemplatesAction());

        this.snippetSub = this._store.select(fromRoot.getCurrent)
            .do(snippet => this.activeSnippetId = snippet ? snippet.id : null)
            .filter(snippet => snippet == null)
            .subscribe(() => {
                this._store.dispatch(new UI.ToggleImportAction(true));
            });

        this.showLocalStorageWarning = !(storage.settings.get('disableLocalStorageWarning') as any === true);

        if (this.documentHasSnippetToImportSetting) {
            this.importInDocumentSnippet();
        }
    }

    show$ = this._store.select(fromRoot.getImportState);
    templates$ = this._store.select(fromRoot.getTemplates);
    gists$ = this._store.select(fromRoot.getGists);
    isLoggedIn$ = this._store.select(fromRoot.getLoggedIn);

    snippets$ = this._store.select(fromRoot.getSnippets)
        .map(snippets => {
            if (isEmpty(snippets)) {
                this.switch('samples');
                this._store.dispatch(new UI.ToggleImportAction(true));
            }
            return snippets;
        });

    ngOnDestroy() {
        if (this.snippetSub) {
            this.snippetSub.unsubscribe();
        }
    }

    hideLocalStorageWarning() {
        this.showLocalStorageWarning = false;
        storage.settings.insert('disableLocalStorageWarning', true as any);
    }

    /* Switch to a particular view (snippets, samples, import wizard) of the import screen */
    switch(view: string) {
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
                mode = Snippet.ImportType.URL_OR_YAML;
                data = this.urlOrSnippet;
                break;

            case 'samples':
                mode = Snippet.ImportType.SAMPLE;
                data = (item as any).rawUrl /** rawUrl field that comes from samples playlists */;
                break;
        }

        if (data == null || data.trim() === '') {
            return;
        }

        data = data.trim();

        this._store.dispatch(new Snippet.ImportAction({
            mode: mode, data: data, saveToLocalStorage: this.view !== 'samples', isReadOnlyViewMode: false
        }));
        this.cancel();
    }

    login() {
        this._store.dispatch(new GitHub.LoginAction());
    }

    new() {
        this._store.dispatch(new Snippet.ImportAction({ mode: Snippet.ImportType.DEFAULT, data: null, saveToLocalStorage: true, isReadOnlyViewMode: false }));
        this._store.dispatch(new UI.ToggleImportAction(false));
    }

    cancel() {
        this._store.dispatch(new UI.ToggleImportAction(false));
    }

    get documentHasSnippetToImportSetting(): boolean {
        return isInsideOfficeApp() && Office.context.document && Office.context.document.settings.get(SNIPPET_TO_IMPORT_PROPERTY_NAME);
    }

    async importInDocumentSnippet(): Promise<void> {
        let commonImportActionParams = {
            saveToLocalStorage: false /* Just like samples, don't save until user makes an edit */,
            isReadOnlyViewMode: false,
            onSuccess: () => {
                this._store.dispatch(new UI.ToggleImportAction(false));
                Office.context.document.settings.remove(CORRELATION_ID_PROPERTY_NAME);
                Office.context.document.settings.remove(SNIPPET_TO_IMPORT_PROPERTY_NAME);
                Office.context.document.settings.saveAsync();
            }
        };

        let correlationId = Office.context.document.settings.get(CORRELATION_ID_PROPERTY_NAME);
        let viewData = Office.context.document.settings.get(SNIPPET_TO_IMPORT_PROPERTY_NAME);

        if (viewData.type === 'samples') {
            let hostJsonFile = `${environment.current.config.samplesUrl}/view/${environment.current.host.toLowerCase()}.json`;
            let onError = error => this._store.dispatch(new UI.ReportErrorAction(Strings().failedToLoadCodeSnippet, error));
            let sub = this._request.get<JSON>(hostJsonFile, ResponseTypes.JSON)
                .subscribe(lookupTable => {
                    if (lookupTable && lookupTable[viewData.id]) {
                        this._store.dispatch(new Snippet.ImportAction({
                            ...commonImportActionParams,
                            mode: Snippet.ImportType.SAMPLE,
                            data: lookupTable[viewData.id]
                        }));
                    }

                    if (sub && !sub.closed) {
                        sub.unsubscribe();
                    }
                }, onError);
        }
        else {
            // Even though user is in editor mode, dispatch with flag to avoid saving gist until user begins typing
            this._store.dispatch(new Snippet.ImportAction({
                ...commonImportActionParams,
                mode: Snippet.ImportType.GIST,
                data: viewData.id
            }));
        }

        AI.trackEvent('Open in playground completed', { id: correlationId });
    }
}
