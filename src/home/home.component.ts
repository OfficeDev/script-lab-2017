import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {SnippetManager} from '../shared/services';
import {UxUtil, ContextUtil} from '../shared/helpers';
import {BaseComponent} from '../shared/components/base.component';

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss']
})
export class HomeComponent extends BaseComponent {
    constructor(
        _router: Router,
        _snippetManager: SnippetManager
    ) {
        super(_router, _snippetManager);        
    }

    navigateToExcel() {
        this._navigateCommon("excel");
    }

    navigateToWord() {
        this._navigateCommon("word");
    }

    navigateToOneNote() {
        this._navigateCommon("onenote");
    }

    navigateToFabric() {
        this._navigateCommon("fabric");
    }

    navigateToTypeScript() {
        this._navigateCommon("typescript");
    }

    private _navigateCommon(context) {
        window.sessionStorage.setItem(ContextUtil.sessionStorageKey_context, context);
        this._router.navigate(["new"]);
    }
}
