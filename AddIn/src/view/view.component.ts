import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetsService} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'view',
    templateUrl: 'view.component.html',
    styleUrls: ['view.component.scss'],
    directives: [Tab, Tabs]
})
export class ViewComponent extends BaseComponent implements OnInit, OnDestroy {
    snippet: Snippet;

    constructor(
        private _snippetManager: SnippetsService,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var id = params['id'];
            this._snippetManager.get(id).then(snippet => this.snippet = snippet);
        });

        this.markDispose(subscription);
    }
}