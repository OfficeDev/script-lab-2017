import * as $ from 'jquery';
import { settings, environment, applyTheme, post } from '../app/helpers';
import { Storage } from '@microsoft/office-js-helpers';
import '../assets/styles/extras.scss';

(async () => {
    await environment.initialize();
    await applyTheme(environment.current.host);
    const gallery = new Gallery();
    gallery.hideProgress();
    gallery.render();
    gallery.renderLastOpened();
})();

export class Gallery {
    private _$progress = $('#progress');
    private _$gallery = $('#gallery');
    private _$snippetList = $('#snippet-list');
    private _$noSnippets = $('#snippet-list-empty');
    private _$lastOpened = $('#last-opened');
    private _$refresh = $('#refresh');

    private _snippets = new Storage<ISnippet>(`playground_${environment.current.host}_snippets`);
    private _template =
    `<article class="gallery-list__item gallery-list__item--template ms-font-m">
        <div class="name">{{name}}</div>
        <div class="description">{{description}}</div>
    </article>`;

    constructor() {
        this._snippets.notify = () => this.render();
        settings.notify = () => this.renderLastOpened();
        this._$refresh.click(() => {
            this._snippets.load();
            settings.reload();
            this.render();
            this.renderLastOpened();
        });
    }

    hideProgress() {
        this._$progress.hide();
        this._$gallery.show();
    }

    renderLastOpened() {
        this._$lastOpened.html('');
        if (settings.current && settings.current.lastOpened) {
            this.insertSnippet(settings.current.lastOpened, this._$lastOpened);
            this._$lastOpened.show();
        }
        else {
            this._$lastOpened.hide();
        }
    }

    render() {
        this._$snippetList.html('');
        if (this._snippets.count) {
            this._$noSnippets.hide();
            this._snippets.values().forEach(snippet => this.insertSnippet(snippet, this._$snippetList));
            this._$snippetList.show();
        }
        else {
            this._$noSnippets.show();
            this._$snippetList.hide();
        }
    }

    insertSnippet({ id, name, description }: ISnippet, location: JQuery) {
        let template = this._template
            .replace('{{name}}', name)
            .replace('{{description}}', description);

        let $item = $(template);
        $item.click(() => this._navigate(id));
        $item.appendTo(location);
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

        const overrides = <ISnippet>{
            host: environment.current.host,
            platform: environment.current.platform,
            origin: environment.current.config.editorUrl,
        };

        const data = JSON.stringify({
            snippet: { ...snippet, ...overrides },
            showBackButton: true,
            returnUrl: location.href
        });

        return post(environment.current.config.runnerUrl + '/compile/page', { data });
    }
}
