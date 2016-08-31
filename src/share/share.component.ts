import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities, UxUtil, ContextUtil} from '../shared/helpers';
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
    gistSharePublic: boolean = true;
    gistId: string;
    viewUrl: string;
    embedScriptTag: string;
    statusDescription = "Preparing the snippet for sharing...";

    _snippet: Snippet;
    _snippetExportString: string;

    constructor(
        _snippetManager: SnippetManager,
        _router: Router,
        private _route: ActivatedRoute

    ) {
        super(_router, _snippetManager);
        this._snippet = new Snippet({}, this._snippetManager);
    }

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }
                            
        var subscription = this._route.params.subscribe(params => {
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this._snippet = snippet;
                    this._snippetExportString = JSON.stringify(snippet.exportToJson(true /*forPlayground*/), null, 4);
                    return this._initializeMonacoEditor()
                })
                .catch(UxUtil.catchError("Could not load snippet", "An error occurred while fetching the snippet."));
        });

        this.markDispose(subscription);
    }

    ngOnDestroy() {
        super.ngOnDestroy();

        if (this._monacoEditor) {
            this._monacoEditor.dispose();
        }
    }

    private _initializeMonacoEditor(): Promise<any> {
        return new Promise((resolve) => {
            console.log("Beginning to initialize Monaco editor");

            (<any>window).require(['vs/editor/editor.main'], () => {
                this._monacoEditor = monaco.editor.create(this._editor.nativeElement, {
                    value: this._snippetExportString,
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

                console.log("Monaco editor initialized.");               
            });
        });
    }

    postToGist() {
        var compiledJs: string;
        try {
            compiledJs = 
                '// This is a compiled version of the TypeScript/JavaScript code ("app.ts").\n' + 
                '// In case the original code was already JavaScript, this is likely identical to "app.js".\n\n' +
                this._snippet.getCompiledJs();
        } catch (e) {
            this.loaded = true;
            UxUtil.showErrorNotification("Please fix syntax errors before sharing", [], e);
            return;
        }

        var startsWithComment = this._snippet.script.trim().startsWith('//') ||
            this._snippet.script.trim().startsWith('/*');

        if (startsWithComment) {
            this._proceedWithPostToGist(compiledJs);
        } else {
            var title = 'Do you want to add a description?';
            var description = "If you're posting the snippet for the world to see, it may be helpful " +
                "to add a description of what the code does.\n\n" + 
                "One simple way to do it is by adding a comment at the top of your script file, explaining " +
                "the snippet's purpose. Would you like to return to the editor and add a comment now?"; 
            
            UxUtil.showDialog(title, description, ['Return to editor', 'Proceed as is'])
                .then((choice) => {
                    if (choice === 'Return to editor') {
                        this.back();
                    } else {
                        this._proceedWithPostToGist(compiledJs);
                    }
                });
        }
    }

    private _proceedWithPostToGist(compiledJs: string) {
        var meta = JSON.stringify(this._snippet.exportToJson(true /*forPlayground*/)['meta'], null, 4);

        // Note: Gist (at least for now?) orders files in alphabetical order.
        // The filenames were [somewhat] chosen accordingly.
        // Putting them in that same order below, for realism's sake

        // Note: name of snippet (as it appears in user's Gist list)
        // is based on topmost filename. So create a .json file with
        // filename as "<space><safe-filename>.json"
        var topmostFilename = 
            (' ' + ContextUtil.contextTagline + ' - ' + this._snippet.meta.name)
                .replace(/[^a-z0-9\-\s]/gi, '_').toLowerCase()
                .replace(/_{2,}/g, '_');

        var fileData = {
            topmostFilename: { 'content': meta },
            "app.js": { 'content': compiledJs },
            "app.ts": { 'content': this._snippet.script },
            "app.css": { 'content': this._snippet.css },
            "index.html": { 'content': this._snippet.html },
            "libraries.txt": { 'content': this._snippet.libraries },            
        };

        for (var key in fileData) {
            if (_.isEmpty(fileData[key]['content'])) {
                delete fileData[key];
            }
        }

        this.statusDescription = "Posting the snippet to a new GitHub Gist...";
        this.loaded = false;

        const gh = new GitHub(); // Note: unauthenticated client, i.e., for creating anonymous gist
        let gist = gh.getGist();
        gist
            .create({
                public: this.gistSharePublic,
                description: '"' + this._snippet.meta.name + '" snippet - ' + ContextUtil.fullPlaygroundDescription,
                files: fileData
            })
            .then(({data}) => {
                let gistJson = data;
                gist.read((err, gist, xhr) => {
                    this.loaded = true;

                    if (err) {                        
                        UxUtil.showErrorNotification("Gist-creation error",
                            "Sorry, something went wrong when creating the GitHub Gist.", err);
                        return;
                    }

                    this.gistId = gist.id;
 
                    this.viewUrl = Utilities.playgroundBasePath + '#/view/gist_' + this.gistId;
                    this.embedScriptTag = `<iframe src="${this.viewUrl}" style="width: 100%; height: 450px"></iframe>`;

                    $(window).scrollTop(0); 
                })
            })
            .catch((e) => {
                this.loaded = true;
                UxUtil.showErrorNotification("Gist-creation failed",
                    "Sorry, something went wrong when creating the GitHub Gist.", e);
            });
    }

    back() {
        this._router.navigate(['edit', this._snippet.meta.id]);
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