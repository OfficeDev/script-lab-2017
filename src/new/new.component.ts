import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities, ContextUtil, ContextType, ExpectedError, UxUtil} from '../shared/helpers';
import {ISnippet, ISnippetMeta, SnippetManager} from '../shared/services';
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
        private _route: ActivatedRoute
    ) {
        super(_router, _snippetManager);        
    }

    link: string;
    localGallery: any;
    gallery: any;
    importFlag = false;

    ngOnInit() {
        if (!this._ensureContext()) {
            return;
        }
        
        this.localGallery = this._snippetManager.getLocal();
        this._snippetManager.getPlaylist().then(data => this.gallery = data);
    }

    delete(snippet: ISnippet): void {
        this._snippetManager.delete(snippet, true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            }).catch(UxUtil.catchError("Error deleting the snippet.", []));
    }

    deleteAll(): void {
        this._snippetManager.deleteAll(true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            })
            .catch(UxUtil.catchError("Error deleting snippets.", []));
    }

    run(snippet: ISnippet) {
        this._router.navigate(['run', snippet.meta.id, false /*returnToEdit*/]);
    }

    select(snippet?: ISnippet) {
        if (Utilities.isEmpty(snippet)) {
            return this._snippetManager.new().then(newSnippet => {
                this._router.navigate(['edit', newSnippet.meta.id]);
            });
        }
        this._router.navigate(['edit', snippet.meta.id]);
    }

    import() {
        this._router.navigate(['import']);
    }

    get title(): string {
        if (ContextUtil.context === ContextType.Unknown) {
            return '';
        }

        return ContextUtil.hostName + ' Snippets';
    }
}
