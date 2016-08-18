import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities, ExpectedError, UxUtil} from '../shared/helpers';
import {ISnippet, ISnippetMeta, SnippetManager} from '../shared/services';
import {BaseComponent} from '../shared/components/base.component';

@Component({
    selector: 'new',
    templateUrl: 'new.component.html',
    styleUrls: ['new.component.scss']
})
export class NewComponent extends BaseComponent implements OnInit, OnDestroy {
    constructor(
        private _router: Router,
        private _route: ActivatedRoute,
        private _snippetManager: SnippetManager
    ) {
        super();
    }

    link: string;
    localGallery: any;
    gallery: any;
    importFlag = false;

    ngOnInit() {
        this.localGallery = this._snippetManager.getLocal();
        this._snippetManager.getPlaylist().then(data => this.gallery = data);
    }

    delete(snippet: ISnippet): void {
        this._snippetManager.delete(snippet, true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            }).catch(UxUtil.showErrorNotification);
    }

    deleteAll(): void {
        this._snippetManager.deleteAll(true /*askForConfirmation*/)
            .then(() => {
                this.localGallery = this._snippetManager.getLocal();
            }).catch(UxUtil.showErrorNotification);
    }

    run(snippet: ISnippet) {
        this._router.navigate(['run', snippet.meta.id, false /*returnToEdit*/]);
    }

    select(snippet?: ISnippet) {
        if (Utilities.isEmpty(snippet)) {
            return this._snippetManager.new().then(newSnippet => {
                this._router.navigate(['edit', newSnippet.meta.id, true /*new*/]);
            });
        }
        this._router.navigate(['edit', snippet.meta.id, false /*new*/]);
    }

    importButtonClick() {
        this.importFlag = !this.importFlag;
        if (this.importFlag) {
            setTimeout(() => $('.new__input--text').focus(), 50);
        }
    }

    import(): void {
        this._snippetManager.import(this.link)
            .then((snippet) => {
                if (Utilities.isEmpty(snippet)) {
                    throw new Error("Could not read snippet data");
                }
                this._router.navigate(['edit', snippet.meta.id, true /*new*/])
            })
            .catch(UxUtil.showErrorNotification);
    }
}