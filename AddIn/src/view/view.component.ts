import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Tab, Tabs} from '../shared/components';
import {BaseComponent} from '../shared/components/base.component';
import {Snippet, SnippetService} from '../shared/services';
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
        private _snippetsService: SnippetService,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this._snippetsService.get(params['id']).then(snippet => this.snippet = snippet);
        });

        this.markDispose(subscription);
    }
}