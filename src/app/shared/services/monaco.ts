import { Injectable, ElementRef } from '@angular/core';
import { Dictionary } from '@microsoft/office-js-helpers';
import { Intellisense } from './intellisense';
import { Utilities } from '../helpers';
import { Request } from './request';

export enum MonacoEvents {
    SAVE,
    TOGGLE_MENU,
    RUN,
    SHARE,
    SWITCH_TABS
}

@Injectable()
export class Monaco {
    private _baseUrl: string;
    private _defaults: monaco.editor.IEditorConstructionOptions = {
        value: '',
        language: 'text',
        lineNumbers: true,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        formatOnType: true,
        fontSize: 14,
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

    static regexStrings = {
        STARTS_WITH_TYPINGS: /^.types~.+|^dt~.+/i,
        STARTS_WITH_COMMENT: /^\/\/.*|^\/\*.*|.*\*\/$.*/im,
        ENDS_WITH_DTS: /.*\.d\.ts$/i,
        GLOBAL: /.*/i
    };

    private intellisense: Dictionary<Dictionary<monaco.IDisposable>>;

    constructor(private _intellisense: Intellisense) {
        this._baseUrl = '/node_modules';
        this.intellisense = new Dictionary<Dictionary<monaco.IDisposable>>();
    }

    current: Promise<typeof monaco>;
    initialize() {
        if (this.current == null) {
            this.current = this._loadMonaco().then(monaco => this._registerLanguageServices(monaco));
        }

        return this.current;
    }

    create(element: ElementRef, overrides?: monaco.editor.IEditorConstructionOptions) {
        let options = _.extend({}, this._defaults, overrides);
        return this.current.then(monaco => monaco.editor.create(element.nativeElement, options));
    }

    updateOptions(editor: monaco.editor.IStandaloneCodeEditor, overrides: monaco.editor.IEditorOptions) {
        if (editor == null || overrides == null) {
            return;
        }

        let options = _.extend({}, this._defaults, overrides);
        editor.updateOptions(options);
    }

    updateLibs(language: string, libraries: string[]) {
        this.current.then(monaco => {
            let urls = this._intellisense.parse(libraries);
            let languageCollection = this.intellisense.get(language);

            return Promise.all(this._intellisense.all(urls)).then(typings => {
                if (languageCollection == null) {
                    typings.forEach(({content, filePath}) => this.addLib(language, content, filePath));
                }
                else {
                    let addedLibraries = _.differenceWith(typings, languageCollection.keys(), (newLib, loadedFile) => newLib.filePath === loadedFile);
                    let removedLibraries = _.differenceWith(languageCollection.keys(), typings, (loadedFile, newLib) => newLib.filePath === loadedFile);

                    addedLibraries.forEach(({ content, filePath }) => {
                        this.addLib(language, content, filePath);
                    });

                    removedLibraries.forEach(item => this.removeLib(language, item));
                }
            });
        });
    }

    addLib(language: string, content: string, filePath: string) {
        return this.current.then(monaco => {
            let instance: monaco.IDisposable;
            language = language.toLowerCase().trim();

            let languageCollection = this.intellisense.get(language);
            if (languageCollection == null) {
                languageCollection = this.intellisense.add(language, new Dictionary<monaco.IDisposable>());
            }

            if (languageCollection.contains(filePath)) {
                return;
            }

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

            return languageCollection.add(filePath, instance);
        });
    }

    removeLib(language: string, filePath: string) {
        return this.current.then(monaco => {
            language = language.toLowerCase().trim();

            if (!this.intellisense.contains(language)) {
                return;
            }

            let languageCollection = this.intellisense.get(language);
            let instance = languageCollection.get(filePath);
            if (instance == null) {
                return;
            }

            instance.dispose();
            return languageCollection.remove(filePath);
        });
    }

    private _loadMonaco() {
        return new Promise<typeof monaco>((resolve, reject) => {
            try {
                let require = (<any>window).require;
                if (require) {
                    const requireConfig = {
                        paths: {
                            'vs': `${this._baseUrl}/monaco-editor/min/vs`
                        }
                    };

                    require.config(requireConfig);
                    require(['vs/editor/editor.main'], () => {
                        let interval = setInterval(() => {
                            try {
                                if (monaco && monaco.editor && monaco.editor.create) {
                                    clearInterval(interval);
                                    return resolve(monaco);
                                }
                            }
                            catch (e) {
                                if (!(e instanceof ReferenceError)) {
                                    return reject(e);
                                }
                            }
                        }, 300);
                    });
                }
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    private _registerLanguageServices(current: typeof monaco) {
        current.languages.register({ id: 'libraries' });
        current.languages.setMonarchTokensProvider('libraries', {
            tokenizer: {
                root: [
                    [Monaco.regexStrings.STARTS_WITH_COMMENT, 'comment'],
                    [Monaco.regexStrings.STARTS_WITH_TYPINGS, 'string'],
                    [Monaco.regexStrings.ENDS_WITH_DTS, 'string'],
                    [Monaco.regexStrings.GLOBAL, 'keyword']
                ]
            },
            tokenPostfix: ''
        });

        current.languages.registerCompletionItemProvider('libraries', {
            provideCompletionItems: (model, position) => {
                let currentLine = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                if (Monaco.regexStrings.STARTS_WITH_TYPINGS.test(currentLine)) {
                    return this._intellisense.typings;
                }
                else if (Monaco.regexStrings.GLOBAL.test(currentLine)) {
                    return this._intellisense.libraries;
                }
                else {
                    return [];
                }
            }
        });

        current.languages.typescript.typescriptDefaults.compilerOptions = {
            module: current.languages.typescript.ModuleKind.CommonJS,
            moduleResolution: current.languages.typescript.ModuleResolutionKind.NodeJs
        };

        return current;
    }
}
