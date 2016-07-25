import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'file-detail',
    template: '<h1>Detail</h1>',
})
export class FileDetailComponent implements OnInit, OnDestroy {
    private subscription1: Subscription;
    private subscription2: Subscription;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        console.log('File Detail created');
        this.subscription1 = this._router.routerState.parent(this._route).params.subscribe(params => console.log(params));
        this.subscription2 = this._route.params.subscribe(params => console.log(params));
    }

    ngOnDestroy() {
        console.log('File Detail destroyed');
        this.subscription1.unsubscribe();
        this.subscription2.unsubscribe();
    }
}