import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { MonacoService } from '../services';
import * as fromRoot from '../reducers';
import { Store } from '@ngrx/store';
import { UI, Monaco, Snippet } from '../actions';

const sample =
    `# Please paste the Snippet URL or JSON into the text area below, and then choose the "Import" button.

# Here are the list of valid urls:
- sampleGistId
- https://gist.github.com/sampleGistId
- https://addin-playground.azurewebsites.net/#/gist/sampleGistId
- https://mywebsite.com/myfolder/mysnippet.yaml

# Or you can also paste a snippet has been exported from the playground such as:

---
id: ''
gist: ''
author: ''
source: Web
name: New Snippet
description: |-
    Sample snippet to demonstrate the use of the Add-in Playground for Web.

script:
  language: typescript
  content: |-
    document.querySelector('#run').addEventListener('click', function () {
        getData().catch(OfficeHelpers.Utilities.log);
    });

    function getData() {
        let url = 'https://jsonplaceholder.typicode.com/posts/1';
        return fetch(url)
            .then(res => res.json())
            .then(data => console.log(data));
    }
`;

@Component({
    selector: 'import',
    template: `
        <dialog class="panel" title="Import" [show]="true">
            <div class="ms-Dialog-content">
                <div id="editor" #editor class="monaco-editor"></div>
            </div>
            <div class=" ms-Dialog-actions ">
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
export class Import implements OnInit {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    private _model: monaco.editor.IModel;

    @ViewChild('editor') private _editor: ElementRef;
    show$: Observable<boolean>;

    constructor(
        private _monaco: MonacoService,
        private _store: Store<fromRoot.State>
    ) {
        (window as any).resize = this._resize.bind(this);
    }

    async ngOnInit() {
        this._monacoEditor = await this._monaco.create(this._editor, { theme: 'vs' });
        this._initialize();
        this._store.select(fromRoot.getImportState).subscribe(() => this._initialize());
    }

    @HostListener('window:resize', ['$event'])
    private _resize() {
        if (this._monacoEditor) {
            setTimeout(() => {
                this._monacoEditor.layout();
                this._monacoEditor.setScrollTop(0);
                this._monacoEditor.setScrollLeft(0);
            }, 10);
        }
    }

    private _initialize() {
        this._model = monaco.editor.createModel(sample, 'yaml');
        this._monacoEditor.setModel(this._model);
        this._monacoEditor.restoreViewState(null);
        this._resize();
        this._monacoEditor.focus();
    }

    import() {
        let inputValue = this._monacoEditor.getValue();
        if (inputValue === sample) {
            return;
        }

        this._store.dispatch(new Snippet.ImportAction(inputValue));
        this.cancel();
    }

    cancel() {
        this._model.dispose();
        this._store.dispatch(new UI.ToggleImportAction(false));
    }
}
