import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';

@Component({
  selector: 'excel-launcher',
  template: '<h3>Redirecting...</h3>',
})
export class ExcelLauncherComponent extends BaseComponent {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
        super();

        window.sessionStorage.setItem('context', 'excel');
        this._router.navigate(['new']);
    }
}
