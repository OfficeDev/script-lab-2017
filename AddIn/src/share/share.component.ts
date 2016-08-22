import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities, UxUtil} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

declare var GitHub;

@Component({
    selector: 'share',
    templateUrl: 'share.component.html',
    styleUrls: ['share.component.scss'],
})
export class ShareComponent extends BaseComponent implements OnInit, OnDestroy {
    private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
    @ViewChild('editor') private _editor: ElementRef;

    loaded: boolean;
    gistId: string;
    embedUrl: string;

    _snippet: Snippet = new Snippet({});

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
                    return this._initializeMonacoEditor()
                })
                .catch(UxUtil.catchError("An error occurred while fetching the snippet."));
        });

        this.markDispose(subscription);
    }

    private _initializeMonacoEditor(): Promise<any> {
        return new Promise((resolve) => {
            console.log("Beginning to initialize Monaco editor");

            (<any>window).require(['vs/editor/editor.main'], () => {
                this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                    value: this._snippet.jsonExportedString,
                    language: 'text',
                    lineNumbers: true,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    wrappingColumn: 0,
                    readOnly: true,
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
            });
        });
    }

    postToGist() {
        var errorMessage
        const gh = new GitHub(); // Note: unauthenticated client, i.e., for creating anonymous gist
        let gist = gh.getGist();
        gist
            .create({
                public: true,
                description: '"' + this._snippet.meta.name + '" snippet - ' + Utilities.playgroundDescription,
                files: {
                    "playground-metadata.json": {
                        "content": this._snippet.jsonExportedString
                    }
                }
            })
            .then(({data}) => {
                let gistJson = data;
                gist.read((err, gist, xhr) => {
                    if (err) {
                        UxUtil.showErrorNotification(
                            "Sorry, something went wrong when creating the GitHub Gist.", err);
                        return;
                    }

                    this.gistId = gist.id;

                    var playgroundBasePath = window.location.protocol + "//" + window.location.hostname + 
                        (window.location.port ? (":" + window.location.port) : "") + window.location.pathname;
                    this.embedUrl = playgroundBasePath + '#/embed/' + this.gistId;

                    $(window).scrollTop(0); 
                })
            })
            .catch(UxUtil.catchError("Sorry, something went wrong when creating the GitHub Gist."));
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