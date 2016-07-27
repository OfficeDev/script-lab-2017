import {Injectable, OnInit, OnDestroy} from '@angular/core';
import {Http} from '@angular/http';
import {Snippet, SnippetsService} from '../services';
import {StorageHelper} from '../helpers';

@Injectable()
export class SnippetManager implements OnInit, OnDestroy {
    private _localStorage: StorageHelper<Snippet>;

    constructor(private _service: SnippetsService) {
        this._localStorage = new StorageHelper<Snippet>('snippets');
    }

    ngOnInit() {
        this._service.get('abc')
            .then(snippet => { console.log(snippet); });
    }

    ngOnDestroy() {
    }

    // TODO: Add methods to call Snippets.Service and store in localStoraege
}