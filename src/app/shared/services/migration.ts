import { Utilities, HostTypes, Storage } from '@microsoft/office-js-helpers';
import { Snippet } from './snippet';

interface IOldSnippet {
    meta: {
        name: string;
        id: string;
    };
    script: string;
    html: string;
    css: string;
    libraries: string;
}

export class Migration {
    private _context = HostTypes[Utilities.host];

    private _oldStore: Storage<IOldSnippet> = new Storage<IOldSnippet>(`${this._context.toLowerCase()}_snippets`);
    private _newStore: Storage<ISnippet> = new Storage<ISnippet>(`${this._context}Snippets`);

    migrate() {
        this._oldStore.values().forEach(oldSnippet => {
            let snippet = new Snippet({
                author: '',
                id: '',
                source: this._context,
                description: '',
                name: oldSnippet.meta.name,
                script: {
                    language: 'typescript',
                    content: oldSnippet.script
                },
                style: {
                    language: 'css',
                    content: oldSnippet.css
                },
                template: {
                    language: 'html',
                    content: oldSnippet.html
                },
                libraries: oldSnippet.libraries
            });

            this._newStore.insert(snippet.content.id, snippet.content);
        });
    }
}
