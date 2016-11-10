import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Authenticator, TokenManager, EndpointManager, IToken, ICode } from '@microsoft/office-js-helpers';

import { BaseComponent } from '../shared/components/base';
import { Utilities, UxUtil, Theme } from '../shared/helpers';
import { Snippet, SnippetManager } from '../shared/services';


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
    profile: any;
    tokenManager = new TokenManager();
    statusDescription = "Preparing the snippet for sharing...";
    progress: boolean;

    _snippet: Snippet;
    _snippetExportString: string;

    token: IToken = this.tokenManager.get('GitHub');

    _environment: {
        GITHUB_TOKEN_SERVICE_URL: string,
        GITHUB_AUTH_CLIENT_ID: string
    }

    constructor(
        _snippetManager: SnippetManager,
        _router: Router,
        private _route: ActivatedRoute,
        private _http: Http

    ) {
        super(_router, _snippetManager);
        this._snippet = new Snippet({});
    }

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }

        if (this.token && this.token.access_token) {
            appInsights.trackEvent('Get cached token', { type: 'Implicit Action' });
            this._getGithubProfile(this.token).then(profile => {
                this.profile = profile;
                appInsights.setAuthenticatedUserContext(this.profile.login);
            });
        }

        var subscription = this._route.params.subscribe(params => {
            this._snippetManager.find(params['id'])
                .then(snippet => {
                    this._snippet = snippet;
                    this._snippetExportString = JSON.stringify(snippet.exportToJson(true /*forPlayground*/), null, 4);
                })
                .then(() => this._initializeMonacoEditor())
                .then(() => {
                    return Utilities.fetchEnvironmentConfig(this._http)
                        .then((env) => this._environment = env);
                })
                .then(() => {
                    this.loaded = true;
                    setTimeout(() => this._monacoEditor.layout(), 100);
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

                console.log("Monaco editor initialized.");

                resolve();
            });
        });
    }

    signInToGithub(): void {
        if (this.progress) return;
        this.progress = true;
        appInsights.trackEvent('Sign In', { type: 'UI Action' });
        var endpointManager = new EndpointManager();

        endpointManager.add('GitHub', {
            clientId: this._environment.GITHUB_AUTH_CLIENT_ID,
            scope: 'gist',
            baseUrl: 'https://github.com/login',
            authorizeUrl: '/oauth/authorize',
            tokenUrl: this._environment.GITHUB_TOKEN_SERVICE_URL,
            state: true
        });

        var authenticator = new Authenticator(endpointManager, this.tokenManager);

        authenticator.authenticate('GitHub', true /* force */)
            .then(token => {
                this.token = token;
                this.progress = false;
                this._getGithubProfile(this.token).then(profile => {
                    this.profile = profile;
                    appInsights.setAuthenticatedUserContext(this.profile.login);
                });
            })
            .catch(error => {
                this.progress = false;
                UxUtil.catchError("Could not sign in to Github", null)
            });
    }

    logout() {
        appInsights.trackEvent('Sign Out', { type: 'UI Action' });
        this.tokenManager.clear();
        appInsights.clearAuthenticatedUserContext();
        this.token = null;
    }

    private _getGithubProfile(token: IToken): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                $.ajax({
                    url: 'https://api.github.com/user',
                    dataType: 'json',
                    headers: {
                        'Authorization': 'Bearer ' + token.access_token
                    }
                }).then(response => resolve(response))
                    .fail(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        });
    }

    postToGist(): void {
        var compiledJs: string;
        appInsights.trackEvent('Post to Gist', { type: 'UI Action' });

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

        this._proceedWithPostToGist(compiledJs);
    }

    private _proceedWithPostToGist(compiledJs: string) {
        // Note: Gists have their content ordered by alphabetical order.
        // The filenames were [somewhat] chosen accordingly.
        // Putting them in that same order below, for realism's sake

        var fileData = {
            "app.js": { 'content': compiledJs },
            "app.ts": { 'content': this._snippet.script },
            "index.html": { 'content': this._snippet.html },
            "libraries.txt": { 'content': this._snippet.libraries },
            "style.css": { 'content': this._snippet.css }
        };

        // Note: name of snippet (as it appears in user's Gist list)
        // is based on topmost filename. So create a .json file with
        // filename as "<space><safe-filename>.json"
        var topmostFilename = ' ' +
            (`${this._snippet.meta.name} (Office Add-in Playground)`)
                .replace(/[^a-z0-9\-\s\(\)]/gi, '_')
                .replace(/_{2,}/g, '_') +
            '.json';
        fileData[topmostFilename] = {
            'content':
            JSON.stringify(this._snippet.exportToJson(true /*forPlayground*/)['meta'], null, 4)
        };

        for (var key in fileData) {
            if (_.isEmpty(fileData[key]['content'])) {
                delete fileData[key];
            }
        }

        var gistDescription = this._snippet.meta.name + ' - Shared with Office Add-in Playground';

        this.statusDescription = "Posting the snippet to a new GitHub Gist...";
        this.loaded = false;

        GistUtilities.postGist(this.token.access_token,
            {
                public: this.gistSharePublic,
                description: gistDescription,
                files: fileData
            })
            .then((gistId) => {
                this.loaded = true;

                this.gistId = gistId;
                this.viewUrl = Utilities.playgroundBasePath + '#/view/gist/' + this.gistId;
                this.embedScriptTag = `<iframe src="${this.viewUrl}" style="display: block; width: 800px; height: 600px;"></iframe>`;

                $(window).scrollTop(0);
            })
            .catch((e) => {
                this.loaded = true;
                UxUtil.showErrorNotification("Gist-creation failed",
                    "Sorry, something went wrong when creating the GitHub Gist.", e);
            });
    }

    get showGithubPersona() {
        return this.token && this.token.access_token;
    }

    get githubViewableGistUrl() {
        return 'https://gist.github.com/' +
            (this.profile ? (this.profile.login + '/') : '') +
            Utilities.stringOrEmpty(this.gistId);
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