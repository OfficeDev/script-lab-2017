import {Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs, IEditorParent} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextUtil, UxUtil} from '../shared/helpers';

enum EditWarning {
    NeverShown,
    Showing,
    Dismissed
}

@Component({
    selector: 'view',
    templateUrl: 'view.component.html',
    styleUrls: ['view.component.scss'],
    directives: [Tab, Tabs]
})
export class ViewComponent extends BaseComponent implements OnInit, OnDestroy, IEditorParent {
    snippet: Snippet;
    currentIntelliSense: string[];

    @ViewChild(Tabs) tabs: Tabs;

    headerName: string;
    thisUrl: string;

    editWarning = EditWarning.NeverShown;

    private _timeout;

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);

        this.thisUrl = window.location.href;
    }

    ngOnInit() {
        this.snippet = new Snippet({});

        var subscription = this._route.params.subscribe(params => {
            var id: string = params['id'];
            if (id.startsWith('gist_')) {
                id = id.substr('gist_'.length);
            }
            id = id.replace('_', '/');
            
            return Snippet.createFromGist(id)
                .then((snippet) => {
                    this.snippet = snippet;
                    this.currentIntelliSense = this.snippet.getTypeScriptDefinitions();
                    this.headerName = `"${snippet.meta.name}" snippet`;

                    ContextUtil.setContext(snippet.attemptToGuessContext());
                    ContextUtil.applyTheme();              
                })
                .catch((e) => {
                    UxUtil.showErrorNotification("Could not display the snippet", null, e,
                        [] /* no buttons, so no way to cancel out the dialog */);
                });
        });

        this.markDispose(subscription);

        this.tabs.editorParent = this;
    }

    onSwitchFocusToJavaScript(): void {
        /* nothing to do, need to implement this function only for fulfilling the IEditorParent contract */
    }

    onChangeContent() {
        if (this.editWarning === EditWarning.NeverShown) {
            this.editWarning = EditWarning.Showing;
            
            setTimeout(() => {
                this.tabs.resize();
                this._changeDetectorRef.detectChanges();
            }, 100);    

            this._timeout = setTimeout(() => {
                clearTimeout(this._timeout);
                this.clearEditWarning();
            }, 10000);

        }
    }

    clearEditWarning() {
        this.editWarning = EditWarning.Dismissed;
        
        this._changeDetectorRef.detectChanges();
        this.tabs.resize();
    }

    get showEditWarning() {
        return this.editWarning === EditWarning.Showing;
    }

    openPlayground() {
        window.open(Utilities.playgroundBasePath + 
            (this.snippet.containsOfficeJsReference ? 'acquire.html' : ''));
    }
}