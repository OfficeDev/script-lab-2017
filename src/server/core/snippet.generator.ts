import * as ts from 'typescript';
import { BadRequestError } from './errors';
import { processLibraries } from './utilities';

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
            api_set: snippet.api_set,
            platform: snippet.platform,
            origin: snippet.origin,
            created_at: snippet.created_at,
            modified_at: snippet.modified_at,
            style: snippet.style.content,
            template: snippet.template.content,
        };

        const { scriptReferences, linkReferences, officeJS } = processLibraries(snippet);

        const script = await this.compileScript(snippet.script);

        // HACK: Need to manually remove es2015 module generation
        compiledSnippet.script = script.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
        compiledSnippet.officeJS = officeJS;
        compiledSnippet.scriptReferences = scriptReferences;
        compiledSnippet.linkReferences = linkReferences;

        return compiledSnippet;
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
                        inlineSourceMap: true,
                        lib: ['dom', 'es2015']
                    }
                });

                if (result.diagnostics.length) {
                    throw new BadRequestError(result.diagnostics.map(item => {
                        let upThroughError = content.substr(0, item.start);
                        let afterError = content.substr(item.start + 1);
                        let lineNumber = upThroughError.split('\n').length;
                        let startIndexOfThisLine = upThroughError.lastIndexOf('\n');
                        let lineText = content.substring(startIndexOfThisLine, item.start + Math.max(afterError.indexOf('\n'), 0)).trim();
                        return `Line #${lineNumber}:  ${item.messageText}` + '\n\n' + lineText;
                    }).join('\n\n\n'));
                }

                return result.outputText;

            case 'javascript':
            default: return content;
        }
    }
}

export const snippetGenerator = new SnippetGenerator();
