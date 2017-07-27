import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { Request, ResponseTypes } from '../services';
import { UI, Snippet } from '../actions';
import { environment, applyTheme } from '../helpers';
import { Strings } from '../strings';

@Component({
    selector: 'view',
    template: `
        <main [ngClass]="theme$|async">
            <editor></editor>
            <footer class="command__bar command__bar--condensed">
                <command id="feedback" [title]="Feedback" icon="Emoji2" (click)="feedback()"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
            </footer>
        </main>
    `
})


export class ViewComponent implements OnInit {
    strings = Strings();

    constructor(
        private _store: Store<fromRoot.State>,
        private _route: ActivatedRoute,
        private _request: Request,
    ) {}

    ngOnInit() {
        let sub = this._route.params
            .subscribe(async(params) => {
                let rawUrl = `${environment.current.config.samplesUrl}/samples/${params.host}/${params.segment}/${params.name}.yaml`;
                return this._request.get<ISnippet>(rawUrl, ResponseTypes.YAML, true /*force bypass of cache*/)
                    .subscribe(snippet => {
                        this._store.dispatch(new Snippet.ImportSuccessAction(snippet));

                        if (environment.current.host !== params.host.toUpperCase()) {
                            environment.current.host = params.host;
                            applyTheme(environment.current.host);
                        }
                    });
            });
        sub.unsubscribe();
    }

    theme$ = this._store.select(fromRoot.getTheme)
        .map(isLight => isLight ? this.strings.lightTheme : this.strings.darkTheme);

    changeTheme() {
        this._store.dispatch(new UI.ChangeThemeAction());
    }

    feedback() {
        window.open(environment.current.config.feedbackUrl);
    }
}
