import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import * as fromRoot from '../reducers';
import { UI, Snippet } from '../actions';
import { environment, applyTheme } from '../helpers';
import { Strings } from '../strings';

@Component({
    selector: 'view-mode',
    template: `
        <main [ngClass]="theme$|async">
            <header class="command__bar">
                <command class="title view-mode" [hidden]="isEmpty" icon="AppForOfficeLogo" [title]="snippet?.name"></command>
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
    showInfo: boolean;
    paramsSub: Subscription;

    constructor(
        private _store: Store<fromRoot.State>,
        private _route: ActivatedRoute
    ) {
        this._store.select(fromRoot.getCurrent).subscribe(snippet => {
            this.snippet = snippet;
        });
    }

    ngOnInit() {
        this.paramsSub = this._route.params
            .subscribe(async(params) => {
                if (environment.current.host.toUpperCase() !== params.host.toUpperCase()) {
                    environment.current.host = params.host.toUpperCase();
                    // Update environment in cache
                    environment.current = environment.current;
                    await applyTheme(environment.current.host);
                }

                let urlSegments = this._route.snapshot.url;
                urlSegments.map(segment => {
                    if (segment.path === 'private-samples') {
                        let rawUrl = `${environment.current.config.samplesUrl}/private-samples/${params.host}/${params.segment}/${params.name}.yaml`;
                        this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.SAMPLE, rawUrl));
                    } else if (segment.path === 'gist') {
                        this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.GIST_VIEW, params.id));
                    } else {
                        let rawUrl = `${environment.current.config.samplesUrl}/samples/${params.host}/${params.segment}/${params.name}.yaml`;
                        this._store.dispatch(new Snippet.ImportAction(Snippet.ImportType.SAMPLE, rawUrl));
                    }
                });
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
