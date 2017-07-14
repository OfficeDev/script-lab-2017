import { Injectable, ElementRef } from '@angular/core';
import { Request, ResponseTypes } from './request';
import { AI } from '../helpers';

const Regex = {
    STARTS_WITH_TYPINGS: /^.types\/.+|^dt~.+/i,
    STARTS_WITH_COMMENT: /^#.*|^\/\/.*|^\/\*.*|.*\*\/$.*/im,
    ENDS_WITH_CSS: /.*\.css$/i,
    ENDS_WITH_DTS: /.*\.d\.ts$/i,
    GLOBAL: /^.*/i
};

@Injectable()
export class MonacoService {
    private _defaults: monaco.editor.IEditorConstructionOptions = {
        value: '',
        language: 'text',
        lineNumbers: true as any,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        formatOnType: true,
        formatOnPaste: true,
        fontSize: 14,
        wrappingColumn: 0,
        folding: true,
        theme: 'vs',
        wrappingIndent: 'indent',
        scrollbar: {
            vertical: 'visible',
            verticalHasArrows: true,
            arrowSize: 15
        }
    };

    constructor(private _request: Request) {
        this._registerLanguageServices();
    }

    private _loadLibrariesIntellisense =
    this._request.local<ILibraryDefinition[]>('libraries.json', ResponseTypes.JSON)
        .toPromise()
        .then((libraries) => libraries.map(
            (library) => {
                let insertText = '';

                if (Array.isArray(library.value)) {
                    insertText += library.value.join('\n');
                }
                else {
                    insertText += library.value || '';
                    insertText += '\n';
                }

                if (Array.isArray(library.typings)) {
                    insertText += (library.typings as string[]).join('\n');
                }
                else {
                    insertText += library.typings || '';
                    insertText += '\n';
                }

                return <monaco.languages.CompletionItem>{
                    label: library.label,
                    documentation: library.description,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: insertText
                };
            }
        ));

    private _libraries: Promise<monaco.languages.CompletionItem[]>;
    get libraries() {
        if (this._libraries == null) {
            this._libraries = this._loadLibrariesIntellisense;
        }

        return this._libraries;
    }

    static current: Promise<typeof monaco>;

    async create(element: ElementRef, overrides?: monaco.editor.IEditorConstructionOptions) {
        let options = { ...this._defaults, ...overrides };
        let monaco = await MonacoService.current;
        return monaco.editor.create(element.nativeElement, options);
    }

    updateOptions(editor: monaco.editor.IStandaloneCodeEditor, overrides: monaco.editor.IEditorOptions) {
        if (editor == null || overrides == null) {
            return;
        }

        let options = { ...this._defaults, ...overrides };
        editor.updateOptions(options);
    }

    static initialize() {
        if (MonacoService.current == null) {
            MonacoService.current = MonacoService._loadMonaco();
        }

        return MonacoService.current;
    }

    static _loadMonaco() {
        return new Promise((resolve, reject) => {
            try {
                let event = AI.trackTimedEvent('[Perf] Monaco loaded');
                let require = (<any>window).require;
                if (require) {
                    let path = `${location.origin}/libs/monaco-editor/vs`;

                    const requireConfig = {
                        paths: {
                            'vs': path
                        }
                    };

                    require.config(requireConfig);
                    require(['vs/editor/editor.main'], () => {
                        event.stop();
                        resolve(monaco);
                    });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }

    private async _registerLanguageServices() {
        let monaco = await MonacoService.current;
        monaco.languages.register({ id: 'libraries' });
        monaco.languages.setMonarchTokensProvider('libraries', {
            tokenizer: {
                root: [
                    [Regex.STARTS_WITH_COMMENT, 'comment'],
                    [Regex.ENDS_WITH_CSS, 'number'],
                    [Regex.STARTS_WITH_TYPINGS, 'string'],
                    [Regex.ENDS_WITH_DTS, 'string'],
                    [Regex.GLOBAL, 'keyword']
                ]
            },
            tokenPostfix: ''
        });

        monaco.languages.registerCompletionItemProvider('libraries', {
            provideCompletionItems: (model, position) => {
                let currentLine = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: 1,
                    endColumn: position.column
                });

                if (Regex.STARTS_WITH_COMMENT.test(currentLine)) {
                    return [];
                }

                if (Regex.GLOBAL.test(currentLine)) {
                    return this.libraries;
                }

                return Promise.resolve([]);
            }
        });

        (monaco.languages.typescript.typescriptDefaults as any).compilerOptions = {
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs
        };

        return monaco;
    };
}
