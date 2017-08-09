import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { UI, Snippet } from '../actions';
import { environment } from '../helpers';
import * as fromRoot from '../reducers';
import { Request, ResponseTypes } from '../services';
import { Strings } from '../strings';

@Component({
    selector: 'view-mode',
    template: `
        <main ngClass="{{theme$|async}} {{host}}">
            <header class="command__bar">
                <command class="view-mode" [hidden]="isEmpty" [title]="snippet?.name"></command>
            </header>
            <editor [isViewMode]="true"></editor>
            <footer class="command__bar command__bar--condensed">
                <command id="feedback" [title]="Feedback" icon="Emoji2" (click)="feedback()"></command>
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
            </footer>
        </main>
    `
})


export class ViewMode implements OnInit, OnDestroy {
    strings = Strings();
    snippet: ISnippet;
    paramsSub: Subscription;

    constructor(
        private _store: Store<fromRoot.State>,
        private _request: Request,
        private _route: ActivatedRoute
    ) {
        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.snippet = snippet;
        });
    }

    get host() {
        return environment.current.host.toLowerCase();
    }

    ngOnInit() {
        this.paramsSub = this._route.params
            .map(params => ({ type: params.type, host: params.host, id: params.id }))
            .mergeMap(({ type, host, id }) => {
                if (environment.current.host.toUpperCase() !== host.toUpperCase()) {
                    environment.current.host = host.toUpperCase();
                    // Update environment in cache
                    environment.current = environment.current;
                }

                switch (type) {
                    case 'samples':
                        let hostJsonFile = `${environment.current.config.samplesUrl}/view/${environment.current.host.toLowerCase()}.json`;
                        return (this._request.get<JSON>(hostJsonFile, ResponseTypes.JSON)
                            .map(lookupTable => ({ lookupTable: lookupTable, id: id }))
                        );
                    case 'gist':
                        return Observable.of({ lookupTable: null, id: id});
                    default:
                        return Observable.of({ lookupTable: null, id: null});
                }
            })
            .subscribe(({ lookupTable, id }) => {
                if (lookupTable && lookupTable[id]) {
                    this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.SAMPLE, lookupTable[id], true /*isViewMode*/));
                } else if (id) {
                    this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.GIST, id, true /*isViewMode*/));
                } else {
                    // Redirect to error page
                    location.hash = '/view/error';
                }
            });
    }

    ngOnDestroy() {
        this.paramsSub.unsubscribe();
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
