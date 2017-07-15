import * as ts from 'typescript';
import { BadRequestError } from './errors';
import { processLibraries } from './libraries.processor';
import { Strings } from './strings';

class SnippetGenerator {
    /**
     * Compiles the snippet, and returns it as a Promise (Promise<ICompiledSnippet>)
     * Using a Promise in case some future compilation does need to be promise-ful.
     **/
    compile(snippet: ISnippet): Promise<ICompiledSnippet> {
        return Promise.resolve()
            .then(() => {
                if (snippet == null) {
                    throw new BadRequestError('Snippet is null');
                }

                let compiledSnippet: ICompiledSnippet = {
                    id: snippet.id,
                    gist: snippet.gist,
                    name: snippet.name,
                    description: snippet.description,
                    host: snippet.host,
                    platform: snippet.platform,
                    origin: snippet.origin,
                    created_at: snippet.created_at,
                    modified_at: snippet.modified_at,
                    style: snippet.style.content,
                    template: snippet.template.content,
                };

                const { scriptReferences, linkReferences, officeJS } = processLibraries(snippet);

                const script = this.compileScript(snippet.script);

                // HACK: Need to manually remove es2015 module generation
                compiledSnippet.script = script.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
                compiledSnippet.officeJS = officeJS;
                compiledSnippet.scriptReferences = scriptReferences;
                compiledSnippet.linkReferences = linkReferences;

                return compiledSnippet;
        });
    }

    compileScript({ language, content }: { language: string, content: string }): string {
        switch (language.toLowerCase()) {
            case 'typescript':
                let result = ts.transpileModule(content, {
                    reportDiagnostics: true,
                    compilerOptions: {
                        target: ts.ScriptTarget.ES5,
                        allowJs: true,
                        lib: ['dom', 'es2015']
                    }
                });

                if (result.diagnostics.length) {
                    throw new BadRequestError(Strings.getSyntaxErrorsTitle(result.diagnostics.length),
                        result.diagnostics.map(item => {
                            let upThroughError = content.substr(0, item.start);
                            let afterError = content.substr(item.start + 1);
                            let lineNumber = upThroughError.split('\n').length;
                            let startIndexOfThisLine = upThroughError.lastIndexOf('\n');
                            let lineText = content.substring(startIndexOfThisLine, item.start + Math.max(afterError.indexOf('\n'), 0)).trim();
                            return `Line #${lineNumber}:  ${item.messageText}` + '\n    ' + lineText;
                        }).join('\n\n')
                    );
                }

                return result.outputText;

            case 'javascript':
                return content;

            default:
                throw new BadRequestError(`Unrecognized script language ${language}`);
        }
    }
}

export const snippetGenerator = new SnippetGenerator();
