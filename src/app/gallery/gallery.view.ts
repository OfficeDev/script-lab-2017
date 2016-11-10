import { Component, OnInit } from '@angular/core';
import { ExpectedError, UxUtil } from '../shared/helpers';
import { SnippetManager, Snippet } from '../shared/services';
import { ViewBase } from '../shared/components/base';
import * as _ from 'lodash';
import './gallery.view.scss';

@Component({
    selector: 'gallery-view',
    templateUrl: 'gallery.view.html'
})
export class GalleryView extends ViewBase implements OnInit {
    link: string;
    localGallery: Promise<ISnippet[]>;
    templateGallery: Promise<IPlaylist>;
    templateGalleryError: string;
    loaded = true;

    constructor(private _snippetManager: SnippetManager) {
        super();
    }

    ngOnInit() {
        this.localGallery = this._snippetManager.local();
        this.templateGallery = this._snippetManager.playlist();
    }

    // delete(snippet: ISnippet): void {
    //     this._snippetManager.delete(snippet, true /*askForConfirmation*/)
    //         .then(() => {
    //             this.localGallery = this._snippetManager.local();
    //         }).catch(UxUtil.catchError("Error deleting the snippet.", []));
    // }

    // deleteAll(): void {
    //     appInsights.trackEvent('Delete all snippets', { type: 'UI Action' });

    //     this._snippetManager.deleteAll(true /*askForConfirmation*/)
    //         .then(() => {
    //             this.localGallery = this._snippetManager.local();
    //         })
    //         .catch(UxUtil.catchError("Error deleting snippets.", []));
    // }

    // run(snippet: ISnippet) {
    //     appInsights.trackEvent('Run from new', { type: 'UI Action' });

    //     this._router.navigate(['run', snippet.meta.id, false /*returnToEdit*/]);
    // }

    // select(snippet?: ISnippet) {
    //     if (_.isEmpty(snippet) || _.isEmpty(snippet.meta)) {
    //         appInsights.trackEvent('Create new snippet', { type: 'UI Action' });
    //         return this._snippetManager.new().then(newSnippet => {
    //             this._router.navigate(['edit', newSnippet.meta.id]);
    //         });
    //     } else {
    //         appInsights.trackEvent('Select snippet', { type: 'UI Action', id: snippet.meta.id, name: snippet.meta.name });
    //     }

    //     this._router.navigate(['edit', snippet.meta.id]);
    // }

    // importFromTemplate(importData: {
    //     name: string,
    //     gistId: string
    // }) {
    //     appInsights.trackEvent('CreateFromTemplate', {
    //         type: 'UI Action',
    //         context: Theme.contextString,
    //         templateName: importData.name,
    //         templateId: importData.gistId
    //     }
    //     );

    //     this.loaded = false;
    //     Promise.resolve()
    //         .then(() => Snippet.createFromGist(importData.gistId, importData.name))
    //         .then((snippet) => this._snippetManager.create(snippet, SuffixOption.UseAsIs))
    //         .then((snippet) => this._router.navigate(['edit', snippet.meta.id]))
    //         .catch((e) => {
    //             this.loaded = true;
    //             UxUtil.showErrorNotification(
    //                 "Could not create the snippet",
    //                 "An error occurred while creating the template snippet.",
    //                 e);
    //         });
    // }

    // navigateToImport() {
    //     this._router.navigate(['import'])
    // }

    // get title(): string {
    //     if (Theme.context === ContextTypes.Unknown) {
    //         return '';
    //     }

    //     return Theme.hostName + ' Snippets';
    // }
}
