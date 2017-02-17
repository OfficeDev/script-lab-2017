import * as ts from 'typescript';
import { Utilities } from './utilities';
import { RunnerError } from './runner-error';

export class SnippetGenerator {
    static async compile(snippet: ISnippet): Promise<CompiledSnippet> {
        if (snippet == null) {
            throw new Error('Snippet was null');
        }

        let compiledSnippet = new CompiledSnippet(snippet);
        compiledSnippet.style = snippet.style.content;
        compiledSnippet.template = snippet.template.content;

        let [{scriptReferences, linkReferences, officeJsRefIfAny}, script] =
            await Promise.all([
                SnippetGenerator.processLibraries(snippet.libraries.split('\n')),
                SnippetGenerator.compileScript(snippet.script)
            ]);

        compiledSnippet.script = script;
        compiledSnippet.officeJsRefIfAny = officeJsRefIfAny;
        compiledSnippet.scriptReferences = scriptReferences;
        compiledSnippet.linkReferences = linkReferences;

        return compiledSnippet;
    }

    static async processLibraries(libraries: string[]) {
        let linkReferences = [];
        let scriptReferences = [];
        let officeJsRefIfAny: string;

        if (libraries != null) {
            for (let library of libraries) {
                processLibraryEntry(library.trim().toLowerCase());
            }
        }

        return { linkReferences, scriptReferences, officeJsRefIfAny };


        function processLibraryEntry(entry: string) {
            if (entry == null) {
                return;
            }

            entry = entry.trim();
            if (entry == '') {
                return;
            }

            var isDefinitivelyNonJsOrCssReference =
                /^\/\/.*|^\/\*.*|.*\*\/$.*/im.test(entry) ||
                /^@types/.test(entry) ||
                /^dt~/.test(entry) ||
                /\.d\.ts$/i.test(entry);

            if (isDefinitivelyNonJsOrCssReference) {
                return;
            }


            // From here on out, assume that we do have something worth adding:

            let resolvedLibrary =
                (/^https?:\/\/|^ftp? :\/\//i.test(entry)) ?
                    entry :
                    `//unpkg.com/${entry}`;

            if (/\.css$/i.test(resolvedLibrary)) {
                linkReferences.push(resolvedLibrary);
                return;
            }

            if (/\.ts$|\.js$/i.test(resolvedLibrary)) {
                if (/(?:office|office.debug).js$/.test(resolvedLibrary)) {
                    if (officeJsRefIfAny) {
                        throw new Error("Unexpected error! More than one Office.js reference defined!");
                    }

                    officeJsRefIfAny = resolvedLibrary;

                    // Don't add Office.js to the rest of the script references --
                    //   it is special because of how it needs to be *outside* of the iframe,
                    //   whereas the rest of the script references need to be inside the iframe.
                    return;
                }

                scriptReferences.push(resolvedLibrary);
                return;
            }

            // If still here, assume it's JS and hope for the best:
            scriptReferences.push(resolvedLibrary);

        }
    }

    static async compileScript({ language, content }: { language: string, content: string }) {
        switch (language.toLowerCase()) {
            case 'typescript':
                let result = ts.transpileModule(content, {
                    reportDiagnostics: true,
                    compilerOptions: {
                        target: ts.ScriptTarget.ES5,
                        allowJs: true,
                        sourceMap: false,
                        lib: ['dom', 'es2015']
                    }
                });

                if (result.diagnostics.length) {
                    throw new RunnerError('Errors during TypeScript compilation',
                        result.diagnostics.map(item => {
                            let upThroughError = content.substr(0, item.start);
                            let afterError = content.substr(item.start + 1);
                            let lineNumber = upThroughError.split('\n').length;
                            let startIndexOfThisLine = upThroughError.lastIndexOf('\n');
                            let lineText = content.substring(startIndexOfThisLine, item.start + Math.max(afterError.indexOf('\n'), 0)).trim();
                            return `Line #${lineNumber}:  ${item.messageText}` + '\n\n' + lineText;
                        }).join('\n\n\n')
                    );
                }

                return result.outputText;
            default: return content;
        }
    }
}

export class CompiledSnippet {
    script: string;
    style: string;
    template: string;
    scriptReferences: string[];
    linkReferences: string[];
    officeJsRefIfAny: string;
    typings: string[];
    name: string;
    id: string;
    author: string;

    constructor(public snippet: ISnippet) {
        this.scriptReferences = [];
        this.linkReferences = [];
        this.typings = [];
        this.id = snippet.id;
        this.name = snippet.name;
        this.author = snippet.author;
    }

    get normalizedOfficeJsRefIfAny(): string {
        return `https:${Utilities.normalizeUrl(this.officeJsRefIfAny)}`;
    }

    get isOfficeSnippet(): boolean {
        return !Utilities.isNullOrWhitespace(this.officeJsRefIfAny);
    }
}
