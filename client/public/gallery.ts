import { settings, environment, Theme, post } from '../app/helpers';
import { Storage } from '@microsoft/office-js-helpers';

export class Gallery {
    private _$list = $('#local-snippet-list');
    private _$progress = $('#progress');
    private _$snippetList = $('#snippet-list');
    private _$noSnippets = $('#no-local-snippets');

    private _snippets = new Storage<ISnippet>(`playground_${environment.current.host}_snippets`);
    private _template =
    `<article class="gallery-list__item gallery-list__item--template ms-font-m">
        <div class="name">{{name}}</div>
        <div class="description">{{description}}</div>
    </article>`;

    constructor() {
        this._snippets.notify = () => this.render();
    }

    static async start() {
        await environment.initialize();
        await Theme.applyTheme(environment.current.host);
    }

    render() {
        this._$snippetList.hide();

        if (this._snippets.count) {
            this._$progress.show();
            this._snippets.values().forEach(snippet => this.insertSnippet(snippet));
            this._$progress.hide();
            this._$snippetList.show();
        }
        else {
            this._$noSnippets.show();
        }
    }

    insertSnippet({ id, name, description }: ISnippet) {
        let template = this._template
            .replace('{{name}}', name)
            .replace('{{description}}', description);

        let $item = $(template);
        $item.click(() => this._navigate(id));
        $item.appendTo(this._$list);
    }

    private _navigate(id: string) {
        let snippet: ISnippet;
        snippet = settings.current.lastOpened && id === settings.current.lastOpened.id ?
            settings.current.lastOpened :
            this._snippets.get(id);

        if (snippet === null) {
            return window.location.reload(true);
        }

        let data = JSON.stringify({
            snippet: snippet,
            returnUrl: window.location.href,
            refreshUrl: window.location.origin + '/refresh.html',

            // Any further fields will simply get passed in to the refresh page:
            id: snippet.id,
            host: OfficeHelpers.Utilities.host,
            platform: OfficeHelpers.Utilities.platform
        });

        return post(environment.current.config.runnerUrl, JSON.stringify({ data }));
    }
}

Gallery.start().then(() => new Gallery());
