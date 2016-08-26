import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'excel-launcher',
    templateUrl: 'launchercommon.html',
    styleUrls: ['launchercommon.component.scss']
})
export class ExcelLauncherComponent extends BaseComponent implements OnInit {
    constructor(
        _snippetManager: SnippetManager,
        _router: Router
    ) {
        super(_router, _snippetManager);

        window.sessionStorage.setItem('context', 'excel');
    }

    ngOnInit() {
        this._router.navigate(['new']);
    }

    get playgroundDescription() {
        return Utilities.fullPlaygroundDescription;
    }
}
