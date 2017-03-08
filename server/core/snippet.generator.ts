import * as ts from 'typescript';
import { BadRequestError } from './errors';

class SnippetGenerator {
    async compile(snippet: ISnippet): Promise<ICompiledSnippet> {
        // TODO: Compilation time log here

        if (snippet == null) {
            throw new BadRequestError('Snippet is null');
        }

        let compiledSnippet: ICompiledSnippet = {
            id: snippet.id,
            gist: snippet.gist,
            author: snippet.author,
            name: snippet.name,
            description: snippet.description,
            host: snippet.host,
            host_version: snippet.host_version,
            platform: snippet.platform,
            origin: snippet.origin,
            created_at: snippet.created_at,
            modified_at: snippet.modified_at,
            style: snippet.style.content,
            template: snippet.template.content,
        };

        let [{ scriptReferences, linkReferences, officeJS }, script] =
            await Promise.all([
                this.processLibraries(snippet.libraries.split('\n')),
                this.compileScript(snippet.script)
            ]);

        compiledSnippet.script = script;
        compiledSnippet.officeJS = officeJS;
        compiledSnippet.scriptReferences = scriptReferences;
        compiledSnippet.linkReferences = linkReferences;

        return compiledSnippet;
    }

    async processLibraries(libraries: string[]) {
        let linkReferences = [];
        let scriptReferences = [];
        let officeJS: string = null;

        libraries.forEach(processLibrary);

        return { linkReferences, scriptReferences, officeJS };

        function processLibrary(text: string) {
            if (text == null || text.trim() === '') {
                return null;
            }

            text = text.trim();

            let isNotScriptOrStyle =
                /^\/\/.*|^\/\*.*|.*\*\/$.*/im.test(text) ||
                /^@types/.test(text) ||
                /^dt~/.test(text) ||
                /\.d\.ts$/i.test(text);

            if (isNotScriptOrStyle) {
                return null;
            }

            let resolvedUrlPath = (/^https?:\/\/|^ftp? :\/\//i.test(text)) ? text : `//unpkg.com/${text}`;

            if (/\.css$/i.test(resolvedUrlPath)) {
                return linkReferences.push(resolvedUrlPath);
            }

            if (/\.ts$|\.js$/i.test(resolvedUrlPath)) {
                /*
                * Don't add Office.js to the rest of the script references --
                * it is special because of how it needs to be *outside* of the iframe,
                * whereas the rest of the script references need to be inside the iframe.
                */
                if (/(?:office|office.debug).js$/.test(resolvedUrlPath)) {
                    officeJS = resolvedUrlPath;
                    return null;
                }

                return scriptReferences.push(resolvedUrlPath);
            }

            return null;
        }
    }

    async compileScript({ language, content }: { language: string, content: string }) {
        switch (language.toLowerCase()) {
            case 'typescript':
                // TODO: Compilation time log here

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
                    throw new BadRequestError('Errors during TypeScript compilation',
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

            case 'javascript':
            default: return content;
        }
    }
}

export const snippetGenerator = new SnippetGenerator();
