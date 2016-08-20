import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';

@Component({
  selector: 'web-launcher',
  template: '<h3>Redirecting...</h3>',
})
export class WebLauncherComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();

        window.sessionStorage.setItem('context', 'web');
    }

    ngOnInit() {
        this._router.navigate(['new']);
    }
}
