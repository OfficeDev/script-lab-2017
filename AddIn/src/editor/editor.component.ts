import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetsService} from '../shared/services';
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
        private _snippets: SnippetsService,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this._snippetId = params['id'];
            this._snippets.get(this._snippetId).then(snippet => {
                console.log(snippet);
                this.snippet = snippet;
            });
        });

        this.markDispose(subscription);
    }
}