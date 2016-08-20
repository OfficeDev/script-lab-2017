import {Injectable} from '@angular/core';
import {ISnippet, Snippet, SnippetService} from '../services';
import {StorageHelper, Utilities, ContextType, ExpectedError, UxUtil} from '../helpers';

@Injectable()
export class SnippetManager {
    private _snippetsContainer: StorageHelper<ISnippet>;

    constructor(private _service: SnippetService) {
        this._snippetsContainer = new StorageHelper<ISnippet>('snippets');
    }

    new(): Promise<Snippet> {
        return new Promise(resolve => {
            var snippet: Snippet;
            if (Utilities.context == ContextType.Web) {
                snippet = this._createBlankWebSnippet();
            } else {
                snippet = this._createBlankOfficeJsSnippet();
            }

            snippet.randomizeId(true);
            snippet.makeNameUnique(false /*isDuplicate*/);
            resolve(this._addSnippetToLocalStorage(snippet));
        });
    }

    save(snippet: Snippet): Promise<ISnippet> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) {
            return Promise.reject(new Error('Snippet metadata cannot be empty')) as any;
        }
        if (Utilities.isEmpty(snippet.meta.name)) return Promise.reject(new Error('Snippet name cannot be empty')) as any;
        snippet.updateHash();
        return Promise.resolve(this._snippetsContainer.insert(snippet.meta.id, snippet));
    }

    delete(snippet: ISnippet, askForConfirmation: boolean): Promise<any> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) {
            return Promise.reject(new Error('Snippet metadata cannot be empty'));
        }

        var that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                    `Are you sure you want to delete the snippet "${snippet.meta.name}"?`, ['Yes', 'No'])
                .then((choice) => {
                    if (choice = 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._snippetsContainer.remove(snippet.meta.id);
            return Promise.resolve();
        }
    }

    deleteAll(askForConfirmation: boolean): Promise<any> {
        var that = this;

        if (askForConfirmation) {
            return UxUtil.showDialog('Delete confirmation',
                    'Are you sure you want to delete *ALL* of your local snippets?', ['Yes', 'No'])
                .then((choice) => {
                    if (choice = 'Yes') {
                        return deleteAndResolvePromise();
                    } else {
                        return Promise.reject(new ExpectedError());
                    }
                });
        } else {
            return deleteAndResolvePromise();
        }

        function deleteAndResolvePromise(): Promise<any> {
            that._snippetsContainer.clear();
            return Promise.resolve();
        }
    }

    getLocal(): ISnippet[] {
        return this._snippetsContainer.values();
    }

    getPlaylist(): Promise<any> {
        return Promise.resolve(this._playlist)
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
                    };
                });

                return {
                    name: data.name,
                    items: remappedArray
                };
            });
    }

    import(id: string): Promise<Snippet> {
        id = id.trim();

        if (Utilities.isEmpty(id)) {
            UxUtil.showDialog('Missing snippet ID', 'Please enter the snippet share ID before proceeding', 'OK');
            throw new ExpectedError();
        }

        if (id.startsWith('http://') || id.startsWith('https://') || id.startsWith('//')) {
            id = id.substr(id.lastIndexOf('/') + 1);
        }

        return this._service.get(id).then(snippet => {
            snippet.randomizeId(true);
            snippet.makeNameUnique(false /*isDuplicate*/);
            return this._addSnippetToLocalStorage(snippet);
        });
    }

    find(id: string): Promise<Snippet> {
        return new Promise(resolve => {
            var result = this._snippetsContainer.get(id);
            resolve(new Snippet(result));
        });
    }

    duplicate(snippet: ISnippet): Promise<Snippet> {
        return new Promise(resolve => {
            if (Utilities.isNull(snippet)) throw 'Snippet cannot be null.';
            var newSnippet = new Snippet(snippet);
            newSnippet.randomizeId(true);
            newSnippet.makeNameUnique(true /*isDuplicate*/);
            resolve(this._addSnippetToLocalStorage(newSnippet));
        });
    }

    publish(snippet: ISnippet, password?: string): Promise<Snippet> {
        var nonEmptyContentTypes: string[] = [];
        var availableTypes = ["html", "script", "css", "libraries"]
        FIXME
        if (!Utilities.isNullOrWhitespace(snippet.css)) { nonEmptyContentTypes.push("css")}

        return this._service.create(snippet.meta.name, nonEmptyContentTypes, password)
            .then(data => {
                snippet.meta.id = data.id;
            })
            .then(data => this._uploadAllContents(snippet));
    }

    update(snippet: ISnippet, password: string): Promise<any> {
        if (Utilities.isEmpty(snippet.meta.name)) return Promise.reject(new Error('Snippet name cannot be empty'));
        if (Utilities.isEmpty(snippet.meta.id)) return Promise.reject(new Error('Snippet id cannot be empty'));
        return this._uploadAllContents(snippet);
    }

    private _uploadAllContents(snippet: ISnippet): Promise<Snippet> {
        if (Utilities.isNull(snippet) || Utilities.isNull(snippet.meta)) {
            return Promise.reject<any>(new Error('Snippet metadata cannot be empty'));
        }
        return Promise.all([
            this._service.upload(snippet.meta, snippet.script, 'script'),
            this._service.upload(snippet.meta, snippet.html, 'html'),
            this._service.upload(snippet.meta, snippet.css, 'css'),
            this._service.upload(snippet.meta, snippet.libraries, 'libraries')
        ]).then(() => snippet);
    }

    private _addSnippetToLocalStorage(snippet: Snippet) {
        this._snippetsContainer.add(snippet.meta.id, snippet);
        return snippet;
    }

    private _playlist = {
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

    private _createBlankOfficeJsSnippet(): Snippet {
        return new Snippet({
            script: Utilities.stripSpaces(`
                ${Utilities.getContextNamespace()}.run(function(context) {
                    // ...
                    return context.sync();
                }).catch(function(error) {
                    console.log(error);
                    if (error instanceof OfficeExtension.Error) {
                        console.log("Debug info: " + JSON.stringify(error.debugInfo));
                    }
                });
            `),
            libraries: Utilities.stripSpaces(`
                # Office.js CDN reference
                //appsforoffice.microsoft.com/lib/1/hosted/Office.js

                # NPM CDN references
                jquery
                office-ui-fabric/dist/js/jquery.fabric.min.js
                office-ui-fabric/dist/css/fabric.min.css
                office-ui-fabric/dist/css/fabric.components.min.css

                # IntelliSense definitions
                //raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/office-js/office-js.d.ts
                //raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/jquery/jquery.d.ts
            `)
        });
    }

    private _createBlankWebSnippet(): Snippet {
        return new Snippet({
            script: Utilities.stripSpaces(`
                console.log("Hello world");
            `),
            libraries: Utilities.stripSpaces(`
                // NPM CDN references
                jquery

                // IntelliSense definitions
                https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/jquery/jquery.d.ts
            `)
        });
    }
}
