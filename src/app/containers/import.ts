import { Component } from '@angular/core';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Snippet } from '../actions';
import { Strings } from '../helpers';

@Component({
    selector: 'import',
    template: `
        <dialog class="panel" [show]="true">
            <section class="gallery__section">
                <ul class="gallery__tabs ms-Pivot ms-Pivot--tabs">
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'url'}" (click)="view = 'url'">${Strings.importUrlTab}</li>
                    <li class="gallery__tab ms-Pivot-link" [ngClass]="{'is-selected gallery__tab--active': view === 'snippet'}" (click)="view = 'snippet'">${Strings.importYamlTab}</li>
                </ul>
                <div class="gallery__tabs-container">
                    <section class="import-tab__section" [hidden]="view !== 'url'">
                        <h1 class="ms-font-xxl import__title">${Strings.importUrlTab}</h1>
                        <p class="ms-font-l import__subtitle">${Strings.importUrlDescription}</p>
                        <div class="ms-TextField import__field">
                            <label class="ms-Label">${Strings.importUrlTextBoxLabel}</label>
                            <input class="ms-TextField-field" type="text" [(ngModel)]="id" placeholder="${Strings.importUrlTextBoxPlaceholder}" >
                        </div>
                        <p class="ms-font-m import__examples">${Strings.urlExamplesTitle}</p>
                        <ol class="ms-font-m import__examples-list">
                            <li>${Strings.urlExample1}</li>
                            <li>${Strings.urlExample2}</li>
                            <li>${Strings.urlExample3}</li>
                            <li>${Strings.urlExample4}</li>
                        </ol>
                    </section>
                    <section class="import-tab__section" [hidden]="view !== 'snippet'">
                        <h1 class="ms-font-xxl import__title">${Strings.importYamlTab}</h1>
                        <p class="ms-font-l import__subtitle">${Strings.importYamlDescription}</p>
                        <div class="ms-TextField ms-TextField--multiline import__field">
                            <label class="ms-Label">${Strings.importYamlTextBoxLabel}</label>
                            <textarea [(ngModel)]="snippet" class="ms-TextField-field"></textarea>
                        </div>
                    </section>
                </div>
            </section>
            <div class="ms-Dialog-actions ">
                <div class="ms-Dialog-actionsRight ">
                    <button class="ms-Dialog-action ms-Button " (click)="import() ">
                        <span class="ms-Button-label">${Strings.importButtonLabel}</span>
                    </button>
                    <button class="ms-Dialog-action ms-Button " (click)="cancel()">
                        <span class="ms-Button-label">${Strings.cancelButtonLabel}</span>
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
