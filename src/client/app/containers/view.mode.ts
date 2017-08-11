import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { HostType } from '@microsoft/office-js-helpers';
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
                <command class="view-disable" [title]="snippet?.name"></command>
                <command *ngIf="openInPlaygroundSupported" class="view-playground" [title]="strings.openInPlayground">
                    <command [title]="openInHostString" (click)="openInPlayground(false)"></command>
                    <command [title]="downloadAsHostFileString" (click)="openInPlayground(true)"></command>
                </command>
            </header>
            <editor [isViewMode]="true"></editor>
            <footer class="command__bar command__bar--condensed">
                <command icon="Color" [title]="theme$|async" (click)="changeTheme()"></command>
                <command class="view-disable" [title]="urlString"></command>
                <command *ngIf="isGist" [title]="strings.openInGithub" (click)="openInGithub()"></command>
            </footer>
        </main>
    `
})


export class ViewMode implements OnInit, OnDestroy {
    strings = Strings();
    snippet: ISnippet;
    paramsSub: Subscription;
    viewType: string;
    viewId: string;

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

    get isGist() {
        return this.snippet && this.snippet.gist;
    }

    get openInPlaygroundSupported() {
        let host = environment.current.host.toUpperCase();
        return host === HostType.EXCEL || host === HostType.WORD || host === HostType.POWERPOINT;
    }

    get openInHostString() {
        return this.strings.openInHost.replace('{0}', environment.current.host);
    }

    get downloadAsHostFileString() {
        return this.strings.downloadAsHostFile.replace('{0}', environment.current.host);
    }

    get urlString() {
        return `URL: ${window.location.href}`;
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

                this.viewType = type;
                this.viewId = id;

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

    openInPlayground(isDownload: boolean) {
        this._store.dispatch(new Snippet.OpenInPlaygroundAction({ type: this.viewType, id: this.viewId, isDownload: isDownload }));
    }

    openInGithub() {
        window.open(`https://gist.github.com/${this.snippet.gist}`);
    }
}
