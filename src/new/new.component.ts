import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities, ContextUtil, ContextType, ExpectedError, UxUtil} from '../shared/helpers';
import {ISnippet, ISnippetMeta, SnippetManager, ISnippetGallery, Snippet, SnippetNamingSuffixOption} from '../shared/services';
import {BaseComponent} from '../shared/components/base.component';


@Component({
    selector: 'new',
    templateUrl: 'new.component.html',
    styleUrls: ['new.component.scss']
})
export class NewComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        _router: Router,
        _snippetManager: SnippetManager,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        super(_router, _snippetManager);
        this.showInfo = !!!(localStorage['Information']);
    }

    showInfo: boolean;
    link: string;
    localGallery: any;
    templateGallery: ISnippetGallery;
    templateGalleryError: string;
    loaded = true;

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }

        this.localGallery = this._snippetManager.getLocal();
        this._snippetManager.getPlaylist()
            .then((data) => {
                this.templateGallery = data;
            })
            .catch((e) => {
                this.templateGalleryError = e.toString();
            })
            .then(() => this._changeDetectorRef.detectChanges());
    }

    gotIt() {
        this.showInfo = false;
        localStorage['Information'] = true;
    }

    delete(snippet: ISnippet): void {
        appInsights.trackEvent('Delete snippet', { type: 'UI Action', id: snippet.meta.id, name: snippet.meta.name });

        this._snippetManager.delete(snippet, true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            }).catch(UxUtil.catchError("Error deleting the snippet.", []));
    }

    deleteAll(): void {
        appInsights.trackEvent('Delete all snippets', { type: 'UI Action' });

        this._snippetManager.deleteAll(true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            })
            .catch(UxUtil.catchError("Error deleting snippets.", []));
    }

    run(snippet: ISnippet) {
        appInsights.trackEvent('Run from new', { type: 'UI Action' });

        this._router.navigate(['run', snippet.meta.id, false /*returnToEdit*/]);
    }

    select(snippet?: ISnippet) {
        if (Utilities.isEmpty(snippet) || Utilities.isEmpty(snippet.meta)) {
            appInsights.trackEvent('Create new snippet', { type: 'UI Action' });
            return this._snippetManager.new().then(newSnippet => {
                this._router.navigate(['edit', newSnippet.meta.id]);
            });
        } else {
            appInsights.trackEvent('Select snippet', { type: 'UI Action', id: snippet.meta.id, name: snippet.meta.name });
        }

        this._router.navigate(['edit', snippet.meta.id]);
    }

    importSnippet(gistId: string, nameOverride: string) {
        appInsights.trackEvent('Import', { type: 'UI Action' });


        this.loaded = false;
        Promise.resolve()
            .then(() => Snippet.createFromGist(gistId, nameOverride))
            .then((snippet) => this._snippetManager.add(snippet, SnippetNamingSuffixOption.UseAsIs))
            .then((snippet) => this._router.navigate(['edit', snippet.meta.id]))
            .catch((e) => {
                this.loaded = true;
                UxUtil.showErrorNotification(
                    "Could not create the snippet",
                    "An error occurred while creating the template snippet.",
                    e);
            });
    }

    navigateToImport() {
        this._router.navigate(['import'])
    }

    get title(): string {
        if (ContextUtil.context === ContextType.Unknown) {
            return '';
        }

        return ContextUtil.hostName + ' Snippets';
    }
}
