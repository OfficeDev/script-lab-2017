import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Tab, MonacoEditor, IEditorParent } from '../components';
import { Snippet, SnippetStore } from '../shared/services';
import { HostTypes, Utilities, Theme, UxUtil, PlaygroundError } from '../shared/helpers';

@Component({
    selector: 'view',
    templateUrl: 'view.component.html',
    styleUrls: ['view.component.scss']
})
export class ViewComponent extends BaseComponent implements OnInit, OnDestroy, IEditorParent {
    snippet: Snippet;
    currentIntelliSense: string[];

    @ViewChild(MonacoEditor) tabs: MonacoEditor;

    headerName: string;
    thisUrl: string;

    constructor(
        _router: Router,
        _snippetManager: SnippetStore,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);

        this.thisUrl = window.location.href;
    }

    ngOnInit() {
        this.snippet = new Snippet({});

        var subscription = this._route.params.subscribe(params => {
            var provider: string = (params['provider'] as string).trim().toLowerCase();
            var id: string = (params['id'] as string).trim().toLowerCase();
            id = id.replace('_', '/');

            return createSnippetFromProvider()
                .then((snippet) => {
                    this.snippet = snippet;
                    this.currentIntelliSense = this.snippet.getTypeScriptDefinitions();
                    this.headerName = `"${snippet.meta.name}" snippet`;

                    Theme.setContext(snippet.attemptToGuessContext());
                    Theme.applyTheme();

                    // Initiate loading IntelliSense, but swallow errors silently if can't loading
                    // (user can't do anything about it on a read-only snippet anyway)
                    // So, no .then, no .catch.  Just let it run
                    this.tabs.initiateLoadIntelliSense();
                })
                .catch((e) => {
                    UxUtil.showErrorNotification("Could not display the snippet", null, e,
                        [] /* no buttons, so no way to cancel out the dialog */);
                });

            function createSnippetFromProvider(): Promise<Snippet> {
                switch (provider) {
                    case 'gist':
                        return Snippet.createFromGist(id);
                    default:
                        throw new PlaygroundError([
                            'Invalid provider specified. Expecting a URL of the form:',
                            Utilities.playgroundBasePath + '/#/view/gist/' + GistUtilities.sampleGistId
                        ]);
                }
            }
        });

        this.markDispose(subscription);

        this.tabs.editorParent = this;
    }

    get isOfficeSnippet() {
        return this.snippet.containsOfficeJsReference;
    }

    openPlayground() {
        // TODO: Redirect to playground or Store deep link

        appInsights.trackEvent('Open Playground clicked', { type: 'UI Action' });

        window.open(Utilities.playgroundBasePath +
            (this.snippet.containsOfficeJsReference ? 'acquire.html' : ''));
    }
}