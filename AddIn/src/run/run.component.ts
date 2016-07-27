import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BaseComponent} from '../shared/components/base.component';
import {Utilities} from '../shared/helpers';
import {Snippet, SnippetManager} from '../shared/services';

@Component({
    selector: 'run',
    templateUrl: 'run.component.html',
    styleUrls: ['run.component.scss'],
})
export class RunComponent extends BaseComponent implements OnInit, OnDestroy {
    @ViewChild('runner') runner: ElementRef;
    snippet: Snippet;

    constructor(
        private _snippetManager: SnippetManager,
        private _route: ActivatedRoute
    ) {
        super();
    }


    ngOnInit() {
        var subscription = this._route.params.subscribe(params => {
            var snippetName = Utilities.decode(params['name']);
            if (Utilities.isEmpty(snippetName)) return;
            this.snippet = this._snippetManager.findByName(snippetName);
            console.log(this.runner.nativeElement);
        });

        this.markDispose(subscription);
    }
}