import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'editor',
    templateUrl: 'editor.component.html',
    styleUrls: ['editor.component.scss'],
    directives: [Tab, Tabs]
})
export class EditorComponent extends BaseComponent implements OnInit, OnDestroy {
    private _snippetId: string = 'abc';
    snippet: any;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this._snippetId = params['name'];
            if (Utilities.isEmpty(this._snippetId)) return;
            this.snippet = this._snippetManager.findByName(decodeURIComponent(this._snippetId));
        });

        this.markDispose(subscription);
    }
}