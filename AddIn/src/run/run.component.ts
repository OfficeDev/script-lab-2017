import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'run',
    templateUrl: 'run.component.html',
    styleUrls: ['run.component.scss'],
})
export class RunComponent extends BaseComponent implements OnInit, OnDestroy {
     snippetId: string;

    constructor(private _route: ActivatedRoute) {
        super();
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            this.snippetId = params['name'];
        });

        this.markDispose(subscription);
    }
}