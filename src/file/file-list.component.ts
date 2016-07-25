import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router, ActivatedRoute, ROUTER_DIRECTIVES} from '@angular/router';


@Component({
    selector: 'file-list',
    template: `
        <h1>File</h1>
        <router-outlet></router-outlet>
    `,
    directives: [ROUTER_DIRECTIVES]
})
export class FileListComponent implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        console.log('File List created');
        this.subscription = this._route.params.subscribe(params => console.log(params));
    }

    ngOnDestroy() {
        console.log('File List destroyed');
        this.subscription.unsubscribe();
    }
}