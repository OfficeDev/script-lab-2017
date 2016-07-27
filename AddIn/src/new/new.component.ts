import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';

@Component({
    selector: 'new',
    templateUrl: 'new.component.html',
    styleUrls: ['new.component.html']
})
export class NewComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();
    }

    ngOnInit() {

    }
}