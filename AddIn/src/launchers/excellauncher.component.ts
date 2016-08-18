import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';

@Component({
  selector: 'excel-launcher',
  template: '<h3>Redirecting...</h3>',
})
export class ExcelLauncherComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();

        window.sessionStorage.setItem('context', 'excel');
    }

    ngOnInit() {
        this._route.params.subscribe(params => {
            if (params['runnable'] === 'true') {
                window.sessionStorage.setItem('runnable', 'true');
            }

            this._router.navigate(['new']);
        });
    }
}
