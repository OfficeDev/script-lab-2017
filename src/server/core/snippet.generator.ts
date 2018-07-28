import * as ts from 'typescript';
import { BadRequestError, InformationalError } from './errors';
import { isMakerScript } from './snippet.helper';
import { injectPerfMarkers } from './perf.injector';

/**
 * Compiles script data
 */
export function compileScript(
  data: { language: string; content: string },
  strings: ServerStrings
): string {
  const { language, content } = data;

  switch (language.toLowerCase()) {
    case 'typescript':
      return compileTypeScript(content, strings);

    case 'javascript':
      return content;

    default:
      throw new BadRequestError(`${strings.unrecognizedScriptLanguage} ${language}`);
  }
}

function compileTypeScript(content: string, strings: ServerStrings) {
  const isMaker = isMakerScript({ content, language: 'typescript' });
  if (isMaker) {
    content = injectPerfMarkers(content);
  }

  let result = ts.transpileModule(content, {
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES5,
      allowJs: true,
      lib: ['dom', 'es2015'],
    },
  });

  if (result.diagnostics.length) {
    throw new InformationalError(
      strings.getSyntaxErrorsTitle(result.diagnostics.length),
      result.diagnostics
        .map(item => {
          let upThroughError = content.substr(0, item.start);
          let afterError = content.substr(item.start + 1);
          let lineNumber = upThroughError.split('\n').length;
          let startIndexOfThisLine = upThroughError.lastIndexOf('\n');
          let lineText = content
            .substring(
              startIndexOfThisLine,
              item.start + Math.max(afterError.indexOf('\n'), 0)
            )
            .trim();
          return (
            `${strings.line} #${lineNumber}:  ${item.messageText}` + '\n    ' + lineText
          );
        })
        .join('\n\n')
    );
  }

  // HACK: Need to manually remove es2015 module generation
  return result.outputText.replace(
    'Object.defineProperty(exports, "__esModule", { value: true });',
    ''
  );
}
