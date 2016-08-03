import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Utilities} from '../shared/helpers';
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
        this._snippetManager.get().then(data => this.localGallery = data);
        this.mockPlaylist()
            .then(data => {
                return {
                    name: data.name,
                    items: _.groupBy(data.snippets, item => item.group)
                };
            })
            .then(data => {
                var remappedArray = _.map(data.items, (value, index) => {
                    return {
                        name: index,
                        items: value
                    }
                });

                return {
                    name: data.name,
                    items: remappedArray
                };
            })
            .then(data => this.gallery = data);
    }

    share(snippet: ISnippet) {

    }

    delete(snippet: ISnippet) {
        this._snippetManager.delete(snippet);
        this._snippetManager.get().then(data => this.localGallery = data);
    }

    run(snippet: ISnippet) {
        this._router.navigate(['run', Utilities.encode(snippet.meta.name)]);
    }

    select(snippet?: ISnippet) {
        if (Utilities.isEmpty(snippet)) {
            this._router.navigate(['edit']);
            return;
        }
        this._router.navigate(['edit', Utilities.encode(snippet.meta.name)]);
    }

    import(snippet?: ISnippetMeta) {
        var link = snippet.id || this.link;        
        this._snippetManager.import(link).then(snippet => this.select(snippet));
    }

    mockPlaylist() {
        var playlist = {
            name: 'Microsoft',
            snippets: [
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set cell ranges',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set formulas',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set background',
                    group: 'Range Manipulation'
                },
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set range values',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set cell ranges',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set formulas',
                    group: 'Tables'
                },
                {
                    id: 'abc',
                    name: 'Set background',
                    group: 'Tables'
                }
            ]
        };

        return Promise.resolve(playlist);
    }
}