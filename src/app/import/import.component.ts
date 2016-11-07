import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from '../shared/components/base.component';
import { Utilities, UxUtil, GistUtilities } from '../shared/helpers';
import { Snippet, SnippetManager } from '../shared/services';

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
    statusDescription = 'Initializing editor for importing...';

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
        let defaultText = '// Enter snippet URL or JSON';

        return new Promise((resolve) => {
            console.log('Beginning to initialize Monaco editor');

            (<any>window).require(['vs/editor/editor.main'], () => {
                this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                    value: defaultText,
                    language: 'text',
                    lineNumbers: true,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    wrappingColumn: 0,
                    wrappingIndent: 'indent',
                    theme: 'vs-dark',
                    scrollbar: {
                        vertical: 'visible',
                        verticalHasArrows: true,
                        arrowSize: 15
                    }
                });

                this.loaded = true;
                setTimeout(() => this._monacoEditor.layout(), 20);

                this._monacoEditor.onDidFocusEditor(() => {
                    if (this._monacoEditor.getModel().getValue() === defaultText) {
                        this._monacoEditor.getModel().setValue('');
                    }
                });

                this._monacoEditor.onDidBlurEditorText(() => {
                    this._monacoEditor.getModel().setValue(
                        this._monacoEditor.getModel().getValue().trim().replace(defaultText, ''));

                    if (this._monacoEditor.getModel().getValue().trim().length === 0) {
                        this._monacoEditor.getModel().setValue(defaultText);
                    }
                });

                console.log('Monaco editor initialized.');
            });
        });
    }

    ngOnDestroy() {
        if (this._monacoEditor) {
            this._monacoEditor.dispose();
            console.log('Monaco editor disposed');
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

        let inputValue = this._monacoEditor.getValue().trim();
        let lowercase = inputValue.toLowerCase();

        let that = this;
        let snippetManager = this._snippetManager;

        if (Utilities.isUrl(inputValue)) {
            let normalized = Utilities.normalizeUrl(inputValue);
            let normalizedGithubPrefix = '//gist.github.com/';
            let normalizedPlaygroundViewPrefix = Utilities.normalizeUrl(
                this.playgroundBasePath + '#/view/gist/');
            if (normalized.startsWith(normalizedGithubPrefix)) {
                addHelper(() => Snippet.createFromGist(
                    normalized.substr(normalizedGithubPrefix.length)), 'url');
            } else if (normalized.startsWith(normalizedPlaygroundViewPrefix)) {
                addHelper(() => Snippet.createFromGist(
                    normalized.substr(normalizedPlaygroundViewPrefix.length).replace('_', '/')), 'url');
            } else {
                this.loaded = true;
                UxUtil.showDialog('Invalid URL for import', [
                    'The supplied URL did not match the expected pattern of',
                    `https://gist.github.com/<gist-id>`,
                    'or',
                    `https:${normalizedPlaygroundViewPrefix}<gist-id>`
                ], 'OK');
                return;
            }
        } else if (Utilities.isJSON(inputValue)) {
            addHelper(() => Snippet.createFromJson(inputValue), 'json');
        } else {
            this.loaded = true;
            UxUtil.showDialog('Invalid Snippet URL or JSON', [
                'The input was not recognized as either a URL or as a valid JSON string.',
                'Please double-check the input and try again.'
            ], 'OK');
            return;
        }

        function addHelper(createAction: () => Snippet | Promise<Snippet>, fromType) {
            let snippet: Snippet;
            Promise.resolve()
                .then(createAction)
                .then((passedInSnippet: Snippet) => {
                    snippet = passedInSnippet;
                    appInsights.trackEvent('Import', { type: 'UI Action', fromType: fromType });
                    return snippetManager.create(snippet, SuffixOption.UseAsIs);
                })
                .then(() => that._router.navigate(['edit', snippet.meta.id]))
                .catch((e) => {
                    that.loaded = true;
                    UxUtil.showErrorNotification(
                        'Could not import snippet',
                        'An error occurred while importing the snippet.',
                        e);
                });
        }
    }

    get playgroundBasePath() {
        return Utilities.playgroundBasePath;
    }

    get sampleGistId() {
        return GistUtilities.sampleGistId;
    }
}
