import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities, MessageStrings} from '../shared/helpers';
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
            }).catch((e) => {
                if (e.Message = MessageStrings.DeletionCancelledByUser) {
                    // do nothing
                } else {
                    throw e;
                    // TODO something should catch this!
                }
            });
    }

    run(snippet: ISnippet) {
        this._router.navigate(['run', snippet.meta.id]);
    }

    select(snippet?: ISnippet) {
        if (Utilities.isEmpty(snippet)) {
            return this._snippetManager.new().then(newSnippet => {
                this._router.navigate(['edit', newSnippet.meta.id]);
            });
        }
        this._router.navigate(['edit', snippet.meta.id]);
    }

    import(snippet?: ISnippetMeta) {
        var link = snippet.id || this.link;
        this._snippetManager.import(link).then(snippet => this.select(snippet));
    }
}