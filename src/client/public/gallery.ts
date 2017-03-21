import * as $ from 'jquery';
import * as moment from 'moment';
import { settings, environment, applyTheme, post } from '../app/helpers';
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
    private _$subtitle = $('#subtitle');
    private _$gallery = $('#gallery');
    private _$snippetList = $('#snippet-list');
    private _$noSnippets = $('#snippet-list-empty');
    private _$lastOpened = $('#last-opened');
    private _$lastOpenedEmpty = $('#last-opened-empty');
    private _$refresh = $('#refresh');

    private _template =
    `<article class="gallery-list__item gallery-list__item--template ms-font-m">
        <div class="name">{{name}}</div>
        <div class="description">{{description}}</div>
    </article>`;

    constructor() {
        this.setUpMomentJsDurationDefaults();

        settings.settings.notify().subscribe(next => this.renderLastOpened());

        settings.snippets.notify().subscribe(next => this.render());

        this._$refresh.click(() => {
            this.render();
            this.renderLastOpened();
            this.hideProgress();
        });
    }

    showProgress(message: string) {
        this._$subtitle.text(message);
        this._$progress.show();
        this._$gallery.hide();
    }

    hideProgress() {
        this._$progress.hide();
        this._$gallery.show();
    }

    renderLastOpened() {
        this._$lastOpened.html('');
        if (settings.lastOpened) {
            this.insertSnippet(settings.current.lastOpened, this._$lastOpened);
            this._$lastOpened.show();
            this._$lastOpenedEmpty.hide();
        }
        else {
            this._$lastOpened.hide();
            this._$lastOpenedEmpty.show();
        }
    }

    render() {
        console.log('Refreshing snippets');
        this._$snippetList.html('');
        if (settings.snippets.count) {
            this._$noSnippets.hide();
            settings.snippets.values().forEach(snippet => this.insertSnippet(snippet, this._$snippetList));
            this._$snippetList.show();
        }
        else {
            this._$noSnippets.show();
            this._$snippetList.hide();
        }
    }

    insertSnippet({ id, name, description, modified_at }: ISnippet, location: JQuery) {
        let template = this._template
            .replace('{{name}}', name)
            .replace('{{description}}', description);

        let $item = $(template);

        $item.click(() => {
            $item.attr('title', '');
            this._navigate(id);
        });

        $item.on('mouseover', () => $item.attr(
            'title', `Last updated ${moment(modified_at).fromNow()}`));

        $item.appendTo(location);
    }

    private _navigate(id: string) {
        // Refresh the snippets and settings, in case there was a code change to one of the snippets.
        let snippet = settings.snippets.get(id);

        /**
         * Check if the clicked snippet is the lastOpened
         */
        if (snippet === null) {
            let lastOpened = settings.lastOpened;
            snippet = id === lastOpened.id ? lastOpened : null;
        }

        /**
         * If the snippet was deleted or was corrupt,
         * then just reload to clear cache.
         */
        if (snippet === null) {
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

        this.showProgress(`Running ${snippet.name}`);
        return post(environment.current.config.runnerUrl + '/compile/page', { data });
    }

    private setUpMomentJsDurationDefaults() {
        moment.relativeTimeThreshold('s', 40);
        // Note, per documentation, "ss" must be set after "s"
        moment.relativeTimeThreshold('ss', 2);
        moment.relativeTimeThreshold('m', 40);
        moment.relativeTimeThreshold('h', 20);
        moment.relativeTimeThreshold('d', 25);
        moment.relativeTimeThreshold('M', 10);
    }
}
