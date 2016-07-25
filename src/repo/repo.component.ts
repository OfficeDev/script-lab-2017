import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'repo',
    templateUrl: 'repo.component.html',
    styles: [require('./repo.component.scss')]
})
export class RepoComponent implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit() {
        console.log('Repo created');        
        this.subscription = this._route.params.subscribe(params => console.log(params));
    }

    ngOnDestroy() {
        console.log('Repo destroyed');
        this.subscription.unsubscribe();
    }

    load() {
        this._router.navigate(['org', 'repo', 'branch']);
    }
}