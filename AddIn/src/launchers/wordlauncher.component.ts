import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {SnippetManager} from '../shared/services';
import {Utilities} from '../shared/helpers';

@Component({
    selector: 'word-launcher',
    templateUrl: 'launchercommon.html',
    styleUrls: ['launchercommon.component.scss']
})
export class WordLauncherComponent extends BaseComponent implements OnInit {
    constructor(
        _snippetManager: SnippetManager,
        _router: Router
    ) {
        super(_router, _snippetManager);

        window.sessionStorage.setItem('context', 'word');
    }

    ngOnInit() {
        this._router.navigate(['new']);
    }

    get playgroundDescription() {
        return Utilities.playgroundDescription + ' for ' + Utilities.captializeFirstLetter(Utilities.contextString);
    }
}
