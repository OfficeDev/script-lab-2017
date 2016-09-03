import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities, UxUtil} from '../shared/helpers';
import {Snippet, SnippetManager, SnippetNamingSuffixOption} from '../shared/services';

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

    sampleGistId = '8a58218a48d39d40431cf934e62a71a2';

    constructor(
        _snippetManager: SnippetManager,
        _router: Router
    ) {
        super(_router, _snippetManager);        
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

                console.log("Monaco editor initialized.");
            });
        });
    }

    ngOnDestroy() {
        if (this._monacoEditor) {
            this._monacoEditor.dispose();
            console.log("Monaco editor disposed");
        }
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
        this.statusDescription = 'Processing the snippet import request, please wait...';
        this.loaded = false;

        var inputValue = this._monacoEditor.getValue().trim();
        var lowercase = inputValue.toLowerCase();

        var that = this;
        var snippetManager = this._snippetManager;

        if (Utilities.isUrl(inputValue)) {
            var normalized = Utilities.normalizeUrl(inputValue)
            var normalizedGithubPrefix = "//gist.github.com/";
            var normalizedPlaygroundViewPrefix = Utilities.normalizeUrl(
                this.playgroundBasePath + "#/view/");
            if (normalized.startsWith(normalizedGithubPrefix)) {
                addHelper(() => Snippet.createFromGist(
                    normalized.substr(normalizedGithubPrefix.length)));
            } else if (normalized.startsWith(normalizedPlaygroundViewPrefix)) {
                addHelper(() => Snippet.createFromGist(
                    normalized.substr(normalizedPlaygroundViewPrefix.length).replace('_', '/')));
            } else {
                this.loaded = true;
                UxUtil.showDialog("Invalid URL for import", [
                    "The supplied URL did not match the expected pattern of",
                    `https://gist.github.com/<gist-id>`,
                    'or',
                    `https:${normalizedPlaygroundViewPrefix}<gist-id>`
                ], 'OK');
                return;
            }            
        } else if (Utilities.isJson(inputValue)) {
            addHelper(() => Snippet.createFromJson(inputValue));
        } else {
            this.loaded = true;
            UxUtil.showDialog("Invalid Snippet URL or JSON", [
                "The input was not recognized as either a URL or as a valid JSON string.",
                "Please double-check the input and try again."
            ], 'OK');
            return;
        }

        function addHelper(createAction: () => Snippet | Promise<Snippet>) {
            var snippet: Snippet;
            Promise.resolve()
                .then(createAction)
                .then((passedInSnippet: Snippet) => {
                    snippet = passedInSnippet;
                    return snippetManager.add(snippet, SnippetNamingSuffixOption.UseAsIs);
                })
                .then(() => that._router.navigate(['edit', snippet.meta.id]))
                .catch((e) => {
                    that.loaded = true;
                    UxUtil.showErrorNotification(
                        "Could not import snippet",
                        "An error occurred while importing the snippet.",
                        e);
                });
        }
    }

    get playgroundBasePath() {
        return Utilities.playgroundBasePath;
    }
}