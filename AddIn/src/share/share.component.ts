import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {UxUtil} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

@Component({
    selector: 'share',
    templateUrl: 'share.component.html',
    styleUrls: ['share.component.scss'],
})
export class ShareComponent extends BaseComponent implements OnInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    @ViewChild('editor') private _editor: ElementRef;

    _snippet: Snippet = new Snippet({});
    _shareLink: string;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    
                    this._snippet = snippet;
                    this._initializeMonacoEditor();
                })
                .catch(e => {
                    UxUtil.showErrorNotification(e);
                });
        });

        this.markDispose(subscription);
    }

    private _initializeMonacoEditor(): void {
        console.log("Beginning to initialize Monaco editor");

        (<any>window).require(['vs/editor/editor.main'], () => {
            this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                value: this._snippet.jsonExportedString,
                language: 'javascript',
                lineNumbers: true,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                wrappingColumn: 0,
                readOnly: true,
                wrappingIndent: "indent",
                theme: "vs-dark"
            });

            this._monacoEditor.layout();
        });
    }

    back() {
        this._router.navigate(['edit', this._snippet.meta.id, false /*new*/]);
    }

    @HostListener('window:resize', ['$event'])
    resize() {
        if (this._monacoEditor) {
            this._monacoEditor.layout();
            this._monacoEditor.setScrollTop(0);
            this._monacoEditor.setScrollLeft(0);
        }
    }
}