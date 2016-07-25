import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'file-create',
    template: '<h1>Create</h1>',
})
export class FileCreateComponent implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        console.log('File Create created');
        this.subscription = this._route.params.subscribe(params => console.log(params));
    }

    ngOnDestroy() {
        console.log('File Create destroyed');
        this.subscription.unsubscribe();
    }
}