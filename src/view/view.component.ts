import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Tab, Tabs, IEditorParent} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

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

    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super(_router, _snippetManager);
    }

    ngOnInit() {
        this.snippet = new Snippet({});
        this.currentIntelliSense = [];
        // var subscription = this._route.params.subscribe(params => {
        //     this._snippetsService.get(params['id']).then(snippet => {
        //         this.snippet = snippet;
        //         this.currentIntelliSense = snippet.getTypeScriptDefinitions();
        //     }); 
        // });

        // this.markDispose(subscription);

        this.tabs.editorParent = this;
    }

    onSwitchFocusToJavaScript(): void {
        return;
    }
}