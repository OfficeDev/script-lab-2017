import * as $ from 'jquery';
import { settings, environment, applyTheme, post } from '../app/helpers';
import { Storage } from '@microsoft/office-js-helpers';
import '../assets/styles/extras.scss';

(async () => {
    await environment.initialize();
    await applyTheme(environment.current.host);
    const gallery = new Gallery();
    gallery.render();
})();

export class Gallery {
    private _$progress = $('#progress');
    private _$gallery = $('#gallery');

    private _$snippetList = $('#snippet-list');
    private _$noSnippets = $('#snippet-list-empty');
    private _$lastOpened = $('#last-opened');

    private _snippets = new Storage<ISnippet>(`playground_${environment.current.host}_snippets`);
    private _template =
    `<article class="gallery-list__item gallery-list__item--template ms-font-m">
        <div class="name">{{name}}</div>
        <div class="description">{{description}}</div>
    </article>`;

    constructor() {
        this._snippets.notify = () => this.render();
        settings.notify = () => this.renderLastOpened();
    }

    renderLastOpened() {
        this._$lastOpened.hide();
    }

    render() {
        this._$snippetList.html('');
        this._snippets.values().forEach(snippet => this.insertSnippet(snippet));
        this._setViewState();
    }

    insertSnippet({ id, name, description }: ISnippet) {
        let template = this._template
            .replace('{{name}}', name)
            .replace('{{description}}', description);

        let $item = $(template);
        $item.click(() => this._navigate(id));
        $item.appendTo(this._$snippetList);
    }

    private _setViewState() {
        if (environment.current.host) {
            if (this._snippets.count || (settings.current && settings.current.lastOpened)) {
                this._$progress.hide();
                this._$noSnippets.hide();
                this._$snippetList.show();
                this._$gallery.show();
            }
            else {
                this._$progress.hide();
                this._$noSnippets.show();
                this._$snippetList.hide();
                this._$gallery.show();
            }
        }
        else {
            this._$progress.show();
            this._$gallery.hide();
        }
    }

    private _navigate(id: string) {
        const snippet = this._snippets.get(id);

        /**
         * If the snippet was deleted or was corrupt,
         * then just reload to clear cache.
         */
        if (snippet === null) {
            this._snippets.load();
            this.render();
        }

        let data = JSON.stringify({
            snippet: snippet,
            showBackButton: true
        });

        return post(environment.current.config.runnerUrl + '/compile/page', JSON.stringify({ data }));
    }
}
