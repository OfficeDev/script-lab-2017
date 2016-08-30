import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {SnippetManager} from '../shared/services';
import {UxUtil, ContextUtil, Utilities} from '../shared/helpers';

@Component({
    selector: 'addin-launcher',
    templateUrl: 'addinlauncher.component.html',
    styleUrls: ['addinlauncher.component.scss']
})
export class AddinLauncherComponent extends BaseComponent implements OnInit {
    constructor(
        _snippetManager: SnippetManager,
        _router: Router,
        private _route: ActivatedRoute
    ) {
        super(_router, _snippetManager);        
    }

    ngOnInit() {
        var subscription = this._route.params.subscribe((params: { [key: string]: string; }) => {
            window.sessionStorage.setItem(ContextUtil.sessionStorageKey_context, params['host'].toLowerCase());
            window.sessionStorage.setItem(ContextUtil.sessionStorageKey_wasLaunchedFromAddin, 'true');

            this._router.navigate(['new']); 
        });

        this.markDispose(subscription);
    }

    get playgroundDescription() {
        return ContextUtil.fullPlaygroundDescription;
    }
}
