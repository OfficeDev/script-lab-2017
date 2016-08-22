import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities, UxUtil} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

declare var GitHub;

@Component({
    selector: 'import',
    templateUrl: 'import.component.html',
    styleUrls: ['import.component.scss'],
})
export class ImportComponent extends BaseComponent implements OnInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    @ViewChild('editor') private _editor: ElementRef;

    loaded: boolean;
    statusDescription = "Initializing editor for importing...";

    constructor(
        private _snippetManager: SnippetManager,
        private _router: Router
    ) {
        super();
    }

    ngOnInit() {                    
        return this._initializeMonacoEditor();
    }

    private _initializeMonacoEditor(): Promise<any> {
        var defaultText = '// Enter snippet ID or URL or JSON';

        return new Promise((resolve) => {
            console.log("Beginning to initialize Monaco editor");

            (<any>window).require(['vs/editor/editor.main'], () => {
                this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                    value: defaultText,
                    language: 'text',
                    lineNumbers: true,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    wrappingColumn: 0,
                    wrappingIndent: "indent",
                    theme: "vs-dark",
                    scrollbar: {
                        vertical: 'visible',
                        verticalHasArrows: true,
                        arrowSize: 15
                    }
                });

                this.loaded = true;
                setTimeout(() => this._monacoEditor.layout(), 20);

                this._monacoEditor.onMouseDown(() => {
                    if (this._monacoEditor.getModel().getValue() === defaultText) {
                        this._monacoEditor.getModel().setValue('');
                    }
                });

                this._monacoEditor.onDidBlurEditorText(() => {
                    if (this._monacoEditor.getModel().getValue().trim().length === 0) {
                        this._monacoEditor.getModel().setValue(defaultText);
                    }
                });
            });
        });
    }

    back() {
        this._router.navigate(['new']);
    }

    @HostListener('window:resize', ['$event'])
    resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
    }

    import() {
        UxUtil.showDialog("Coming soon!", "Not yet implemented", "OK");
    }
}