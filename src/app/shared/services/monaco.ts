import { Injectable, ElementRef } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Intellisense } from './intellisense';
import { Utilities } from '../helpers';

@Injectable()
export class Monaco {
    private _baseUrl: string;
    private _defaults: monaco.editor.IEditorConstructionOptions = {
        value: '',
        language: 'text',
        lineNumbers: true,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        wrappingColumn: 0,
        theme: 'vs',
        wrappingIndent: 'indent',
        scrollbar: {
            vertical: 'visible',
            verticalHasArrows: true,
            arrowSize: 15
        },
        model: null
    };

    private _intellisense: Dictionary<Dictionary<monaco.IDisposable>>;

    constructor(private intellisense: Intellisense) {
        this._baseUrl = '/node_modules';
        this._intellisense = new Dictionary<Dictionary<monaco.IDisposable>>();
    }

    get current() {
        return this._loadMonaco().then(() => this._registerLanguage());
    }

    create(element: ElementRef, overrides?: monaco.editor.IEditorConstructionOptions) {
        let options = _.extend({}, this._defaults, overrides);
        return this.current.then(() => monaco.editor.create(element.nativeElement, options));
    }

    updateLibs(language: string, libraries: string[]) {
        this.current.then(() => {
            let urls = this.intellisense.parse(libraries);
            let languageCollection = this._intellisense.get(language);
            Promise.all(this.intellisense.all(urls))
                .then(typings => {
                    debugger;

                    if (languageCollection == null) {
                        typings.forEach(({content, filePath}) => this.addLib(language, content, filePath));
                    }
                    else {
                        let addedLibraries = _.differenceWith(typings, languageCollection.keys(), (newLib, loadedFile) => newLib.filePath === loadedFile);
                        let removedLibraries = _.differenceWith(languageCollection.keys(), typings, (loadedFile, newLib) => newLib.filePath === loadedFile);

                        debugger;

                        addedLibraries.forEach(({ content, filePath }) => {
                            this.addLib(language, content, filePath);
                        });

                        removedLibraries.forEach(item => this.removeLib(language, item));
                    }
                });
        });
    }

    addLib(language: string, content: string, filePath: string) {
        this.current.then(() => {
            let instance: monaco.IDisposable;
            language = language.toLowerCase().trim();

            let languageCollection = this._intellisense.get(language);
            if (languageCollection == null) {
                languageCollection = this._intellisense.add(language, new Dictionary<monaco.IDisposable>());
            }

            if (languageCollection.contains(filePath)) {
                return;
            }

            debugger;

            switch (language) {
                case 'typescript':
                    instance = monaco.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
                    break;

                case 'javascript':
                    instance = monaco.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
                    break;

                case 'css': break;
                case 'json': break;
                case 'html': break;
                default: break;
            }

            if (instance == null) {
                return;
            }

            languageCollection.add(filePath, instance);
        });
    }

    removeLib(language: string, filePath: string) {
        this.current.then(() => {
            language = language.toLowerCase().trim();

            if (!this._intellisense.contains(language)) {
                return;
            }

            let languageCollection = this._intellisense.get(language);
            let instance = languageCollection.get(filePath);
            if (instance == null) {
                return;
            }

            instance.dispose();
            languageCollection.remove(filePath);
        });
    }

    private _loadMonaco() {
        return new Promise((resolve, reject) => {
            try {
                let require = (<any>window).require;
                if (require) {
                    const requireConfig = {
                        paths: {
                            'vs': `${this._baseUrl}/monaco-editor/min/vs`
                        }
                    };
                    require.config(requireConfig);
                    require(['vs/editor/editor.main'], () => resolve());
                }
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    private _registerLanguage() {
        return new Promise((resolve, reject) => {
            try {
                monaco.languages.register({ id: 'script-references' });
                monaco.languages.setMonarchTokensProvider('script-references', {
                    tokenizer: {
                        root: [
                            // Anything starting with # is considered as a comment
                            [/^#.*/im, 'comment'],

                            // Anything starting with @types or dt~ or ending with d.ts is IntelliSense
                            [/^.types.*|^dt~.*/i, 'string'],
                            [/.*\.d\.ts$/i, 'string'],

                            // Anything else presumed to be TS or JS or CSS reference
                            [/.*/i, 'keyword']
                        ]
                    },
                    tokenPostfix: ''
                });

                resolve();
            }
            catch (exception) {
                reject(exception);
            }
        });
    }
}
