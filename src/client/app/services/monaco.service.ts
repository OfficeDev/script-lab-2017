import { Injectable, ElementRef } from '@angular/core';
import { Request, ResponseTypes } from './request';
import { AI, getVersionedPackageUrl } from '../helpers';

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
        minimap: {
            enabled: false
        },
        roundedSelection: false,
        scrollBeyondLastLine: false,
        formatOnType: true,
        formatOnPaste: true,
        fontSize: 14,
        wordWrap: 'on',
        folding: true,
        theme: 'vs',
        wrappingIndent: 'indent',
        scrollbar: {
            vertical: 'visible',
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

    static initialize() {
        if (MonacoService.current == null) {
            MonacoService.current = MonacoService._loadMonaco();
        }

        return MonacoService.current;
    }

    static _loadMonaco() {
        return new Promise<typeof monaco>((resolve, reject) => {
            try {
                let event = AI.trackTimedEvent('[Perf] Monaco loaded');
                let require = (<any>window).require;
                if (require) {
                    let path = getVersionedPackageUrl(location.origin, 'monaco-editor', 'vs');

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
        monaco.languages.setMonarchTokensProvider('libraries', <monaco.languages.IMonarchLanguage>{
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

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [{
                uri: '',
                fileMatch: ['*'],
                schema: {
                    '$id': 'http://example.com/example.json',
                    'type': 'object',
                    'definitions': {},
                    '$schema': 'http://json-schema.org/draft-07/schema#',
                    'properties': {
                        'namespace': {
                            '$id': '/properties/namespace',
                            'type': 'string',
                            'title': 'The Namespace Schema ',
                            'default': '',
                            'examples': [
                                'arithmetic'
                            ]
                        },
                        'functions': {
                            '$id': '/properties/functions',
                            'type': 'array',
                            'items': {
                                '$id': '/properties/functions/items',
                                'type': 'object',
                                'properties': {
                                    'name': {
                                        '$id': '/properties/functions/items/properties/name',
                                        'type': 'string',
                                        'title': 'The Name Schema ',
                                        'default': '',
                                        'examples': [
                                            'multiply10'
                                        ]
                                    },
                                    'description': {
                                        '$id': '/properties/functions/items/properties/description',
                                        'type': 'string',
                                        'title': 'The Description Schema ',
                                        'default': '',
                                        'examples': [
                                            'Multiplies 10 to the input number'
                                        ]
                                    },
                                    'helpUrl': {
                                        '$id': '/properties/functions/items/properties/helpUrl',
                                        'type': 'string',
                                        'title': 'The Helpurl Schema ',
                                        'default': '',
                                        'examples': [
                                            'http://dev.office.com'
                                        ]
                                    },
                                    'result': {
                                        '$id': '/properties/functions/items/properties/result',
                                        'type': 'object',
                                        'properties': {
                                            'type': {
                                                '$id': '/properties/functions/items/properties/result/properties/type',
                                                'type': 'string',
                                                'title': 'The Type Schema ',
                                                'default': '',
                                                'examples': [
                                                    'number'
                                                ]
                                            },
                                            'dimensionality': {
                                                '$id': '/properties/functions/items/properties/result/properties/dimensionality',
                                                'type': 'string',
                                                'title': 'The Dimensionality Schema ',
                                                'default': '',
                                                'examples': [
                                                    'scalar'
                                                ]
                                            }
                                        }
                                    },
                                    'parameters': {
                                        '$id': '/properties/functions/items/properties/parameters',
                                        'type': 'array',
                                        'items': {
                                            '$id': '/properties/functions/items/properties/parameters/items',
                                            'type': 'object',
                                            'properties': {
                                                'name': {
                                                    '$id': '/properties/functions/items/properties/parameters/items/properties/name',
                                                    'type': 'string',
                                                    'title': 'The Name Schema ',
                                                    'default': '',
                                                    'examples': [
                                                        'num'
                                                    ]
                                                },
                                                'description': {
                                                    '$id': '/properties/functions/items/properties/parameters/items/properties/description',
                                                    'type': 'string',
                                                    'title': 'The Description Schema ',
                                                    'default': '',
                                                    'examples': [
                                                        'The number to multiply to 10'
                                                    ]
                                                },
                                                'type': {
                                                    '$id': '/properties/functions/items/properties/parameters/items/properties/type',
                                                    'type': 'string',
                                                    'title': 'The Type Schema ',
                                                    'default': '',
                                                    'examples': [
                                                        'number'
                                                    ]
                                                },
                                                'dimensionality': {
                                                    '$id': '/properties/functions/items/properties/parameters/items/properties/dimensionality',
                                                    'type': 'string',
                                                    'title': 'The Dimensionality Schema ',
                                                    'default': '',
                                                    'examples': [
                                                        'scalar'
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    'options': {
                                        '$id': '/properties/functions/items/properties/options',
                                        'type': 'object',
                                        'properties': {
                                            'sync': {
                                                '$id': '/properties/functions/items/properties/options/properties/sync',
                                                'type': 'boolean',
                                                'title': 'The Sync Schema ',
                                                'default': false,
                                                'examples': [
                                                    false
                                                ]
                                            },
                                            'stream': {
                                                '$id': '/properties/functions/items/properties/options/properties/stream',
                                                'type': 'boolean',
                                                'title': 'The Stream Schema ',
                                                'default': false,
                                                'examples': [
                                                    false
                                                ]
                                            },
                                            'volatile': {
                                                '$id': '/properties/functions/items/properties/options/properties/volatile',
                                                'type': 'boolean',
                                                'title': 'The Volatile Schema ',
                                                'default': false,
                                                'examples': [
                                                    false
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },

            }]
        });


        return monaco;
    };
}
