import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { HostType } from '@microsoft/office-js-helpers';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { UI, Snippet } from '../actions';
import { environment, getGistUrl, getHostAppName } from '../helpers';
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
                    <command *ngIf="tryItSupported" [title]="strings.openTryIt" (click)="openTryIt()"></command>
                    <command *ngIf="openInHostSupported" [title]="openInHostString" (click)="openInPlayground(false)"></command>
                    <command *ngIf="downloadAsFileSupported" [title]="strings.downloadAsFile" (click)="openInPlayground(true)"></command>
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
    displayUrl: string;
    snippetSub: Subscription;

    constructor(
        private _store: Store<fromRoot.State>,
        private _request: Request,
        private _route: ActivatedRoute
    ) {
        this.snippetSub = this._store.select(fromRoot.getCurrent).subscribe(snippet => {
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
        let isSupportedOfficeHost =
            host === HostType.EXCEL ||
            host === HostType.WORD ||
            host === HostType.POWERPOINT;
        if (!isSupportedOfficeHost) {
            return false;
        }

        return this.tryItSupported || this.openInHostSupported || this.downloadAsFileSupported;
    }

    get openInHostString() {
        return this.strings.openInHost.replace('{0}', getHostAppName(environment.current.host));
    }

    get tryItSupported() {
        return environment.current.wacUrl &&
            environment.current.host.toUpperCase() === HostType.EXCEL /* &&
            FIXME: Ensure not Safari browser */;
    }

    get openInHostSupported() {
        return true /* && Ensure Windows OS */;
    }

    get downloadAsFileSupported() {
        return !this.openInHostSupported /* No need to show it twice */
        /* && FIXME: only Windows or Mac */
    }

    get urlString() {
        return `URL: ${this.displayUrl}`;
    }

    ngOnInit() {
        this.paramsSub = this._route.params
            .map(params => ({ type: params.type, host: params.host, id: params.id }))
            .mergeMap(({ type, host, id }) => {
                this.displayUrl = `${environment.current.config.editorUrl}/#/view/${host}/${type}/${id}`;
                if (environment.current.host.toUpperCase() !== host.toUpperCase()) {
                    environment.appendCurrent({ host: host.toUpperCase() });
                }

                this.viewType = type;
                this.viewId = id;

                switch (type) {
                    case 'samples':
                        let hostJsonFile = `${environment.current.config.samplesUrl}/view/${environment.current.host.toLowerCase()}.json`;
                        return this._request.get<JSON>(hostJsonFile, ResponseTypes.JSON, true /*forceBypassCache*/)
                            .map(lookupTable => ({ lookupTable: lookupTable, id: id }))
                            .catch(exception => Observable.of({ lookupTable: null, id: null }));
                    case 'gist':
                        return Observable.of({ lookupTable: null, id: id });
                    default:
                        return Observable.of({ lookupTable: null, id: null });
                }
            })
            .subscribe(({ lookupTable, id }) => {
                if (lookupTable && lookupTable[id]) {
                    this._store.dispatch(new Snippet.ImportAction({ mode: Snippet.ImportType.SAMPLE, data: lookupTable[id], isReadOnlyViewMode: true, saveToLocalStorage: false }));
                } else if (id) {
                    this._store.dispatch(new Snippet.ImportAction({ mode: Snippet.ImportType.GIST, data: id, isReadOnlyViewMode: true, saveToLocalStorage: false }));
                } else {
                    // Redirect to error page
                    location.hash = '/view/error';
                }
            });
    }

    ngOnDestroy() {
        if (this.paramsSub) {
            this.paramsSub.unsubscribe();
        }
        if (this.snippetSub) {
            this.snippetSub.unsubscribe();
        }
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
        this._store.dispatch(new Snippet.OpenInPlaygroundAction({ type: this.viewType, id: this.viewId, isDownload }));
    }

    openInGithub() {
        window.open(getGistUrl(this.snippet.gist));
    }

    openTryIt() {
        environment.updateRunnerUrlForWacEmbed();

        const url = `${environment.current.config.runnerUrl}/try/${
            environment.current.host}/${this.viewType}/${this.viewId}`;

        window.open(url, '_blank');
    }
}
