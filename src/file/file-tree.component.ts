import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'file-tree',
    template: '<h1>Tree</h1><button (click)="load()">Tree Page</button><button (click)="load2()">Detail Page</button><button (click)="load3()">Create Page</button>'
})
export class FileTreeComponent implements OnInit, OnDestroy {
    private subscription1: Subscription;
    private subscription2: Subscription;

    static id = 0;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        console.log('File Tree created');
        this.subscription1 = this._router.routerState.parent(this._route).params.subscribe(params => console.log(params));
        this.subscription2 = this._route.params.subscribe(params => console.log("inc", params));
    }

    ngOnDestroy() {
        console.log('File Tree destroyed');
        this.subscription1.unsubscribe();
        this.subscription2.unsubscribe();
    }

    load() {
        this._router.navigate(['org', 'repo', 'branch', FileTreeComponent.id++]);
    }

    load2() {
        this._router.navigate(['org', 'repo', 'branch', FileTreeComponent.id++, 'detail']);
    }

    load3() {
        this._router.navigate(['org', 'repo', 'branch', 'create', FileTreeComponent.id++]);
    }
}