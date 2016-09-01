import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs, IEditorParent} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetManager} from '../shared/services';
import {Utilities, ContextUtil, UxUtil} from '../shared/helpers';

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

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super(_router, _snippetManager);
    }

    ngOnInit() {
        this.snippet = new Snippet({});

        var subscription = this._route.params.subscribe(params => {
            var id: string = params['id'];
            if (id.startsWith('gist_')) {
                return Snippet.createFromGist(id.substr('gist_'.length))
                    .then((snippet) => {
                        this.snippet = snippet;
                        this.currentIntelliSense = this.snippet.getTypeScriptDefinitions();
                        this.headerName = `"${snippet.meta.name}" snippet`;              
                    })
                    .catch(UxUtil.catchError("Could not display snippet", null));
            }
        });

        this.markDispose(subscription);

        this.tabs.editorParent = this;
    }

    onSwitchFocusToJavaScript(): void {
        /* nothing to do, need to implement this function only for fulfilling the IEditorParent contract */
    }

    openPlayground() {
        window.open(Utilities.playgroundBasePath);
    }
}