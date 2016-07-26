import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';

@Component({
    selector: 'snippet-create',
    templateUrl: 'snippet-create.component.html',
    styleUrls: ['snippet-create.component.html']
})
export class SnippetCreateComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {

    }
}