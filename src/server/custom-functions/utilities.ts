import { parseMetadata } from './metadata.parser';
import { compileScript } from '../core/snippet.generator';
import { stripSpaces } from '../core/utilities';

export function getCustomFunctionsInfoForRegistration(
  snippets: ISnippet[],
  strings: ServerStrings
): { visual: ICFVisualMetadata; code: string } {
  const visualMetadata: ICFVisualSnippetMetadata[] = [];
  const code: string[] = [];

  snippets.filter(snippet => snippet.script && snippet.name).forEach(snippet => {
    const namespace = transformSnippetName(snippet.name);

    let snippetFunctions: ICFVisualFunctionMetadata[] = parseMetadata(
      namespace,
      snippet.script.content
    ) as ICFVisualFunctionMetadata[];

    snippetFunctions = convertFunctionErrorsToSpace(snippetFunctions);
    if (snippetFunctions.length === 0) {
      // no custom functions found
      return;
    }

    let hasErrors = doesSnippetHaveErrors(snippetFunctions);

    let snippetCode: string;
    if (!hasErrors) {
      try {
        snippetCode = compileScript(snippet.script, strings);
      } catch (e) {
        snippetFunctions.forEach(f => (f.error = 'Snippet compiler error'));
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      code.push(
        wrapCustomFunctionSnippetCode(
          snippetCode,
          namespace,
          snippetFunctions.map(func => func.funcName)
        )
      );
    }

    snippetFunctions = snippetFunctions.map(func => {
      const status: CustomFunctionsRegistrationStatus = hasErrors
        ? func.error
          ? 'error'
          : 'skipped'
        : 'good';

      func.parameters = func.parameters.map(p => ({
        ...p,
        prettyType: getPrettyType(p),
        status: getFunctionChildNodeStatus(func, status, p),
      }));

      return {
        ...func,
        paramString: paramStringExtractor(func), // todo, i think this can be removed
        status,
        result: {
          ...func.result,
          status: getFunctionChildNodeStatus(func, status, func.result),
        },
      };
    });

    // TODO:  why do we have code commented out?
    // const isTrusted = trustedSnippetManager.isSnippetTrusted(snippet.id, snippet.gist, snippet.gistOwnerId);
    // let status;
    // if (isTrusted) {
    let status: CustomFunctionsRegistrationStatus = hasErrors ? 'error' : 'good';
    // } else {
    //     status = CustomFunctionsRegistrationStatus.Untrusted;
    // }

    visualMetadata.push({
      name: transformSnippetName(snippet.name),
      error: hasErrors,
      status,
      functions: snippetFunctions,
    });
  });

  const visual = { snippets: visualMetadata };

  return { visual, code: code.join('\n\n') };
}

// helpers

function wrapCustomFunctionSnippetCode(
  code: string,
  namespace: string,
  functionNames: string[]
): string {
  const newlineAndIndents = '\n        ';

  /*
    // TODO MIZLATKO external code

    // TODO MIZLATKO eventually enable console.log & etc.
    var console = {
      log: function() {
        // do nothing for now
      },
      warn: function() {
        // do nothing for now
      },
      error: function() {
        // do nothing for now
      },
    }
  */
  const almostReady = stripSpaces(`
    (function () {
      try {
        // TODO external code

        ${code
          .split('\n')
          .map(line => newlineAndIndents + line)
          .join('')}

        ${generateFunctionAssignments()}
      } catch (e) {
        function onError() {
          throw e;
        }
        ${generateFunctionAssignments('onError')}
      }
    })();  
  `);

  return almostReady
    .split('\n')
    .map(line => line.trimRight())
    .join('\n');

  // Helper
  function generateFunctionAssignments(override?: string) {
    return functionNames
      .map(
        name =>
          `CustomFunctionMappings["${namespace.toUpperCase()}.${name.toUpperCase()}"] = ${
            override ? override : name
          };`
      )
      .join(newlineAndIndents);
  }
}

function getFunctionChildNodeStatus(
  func: ICFVisualFunctionMetadata,
  funcStatus: CustomFunctionsRegistrationStatus,
  childNode: { error?: any }
): CustomFunctionsRegistrationStatus {
  return func.error ? (childNode.error ? 'error' : 'skipped') : funcStatus;
}

function getPrettyType(parameter) {
  if (parameter.error) {
    return '';
  }
  const dim = parameter.dimensionality === 'scalar' ? '' : '[][]';
  return `${parameter.type}${dim}`;
}

function paramStringExtractor(func) {
  if (func.error) {
    return undefined;
  }
  return func.parameters
    .map(p => {
      return `${p.name}: ${getPrettyType(p)}`;
    })
    .join(', ');
}

function doesSnippetHaveErrors(snippetMetadata) {
  return snippetMetadata.some(func => func.error);
}

/**
 * This function converts all the `true` errors on the functions to ' '. This is because we still want it
 * to have a truthy value, but not show anything in the UI, and this is the best way I could manage that at this time.
 * @param functions
 */
function convertFunctionErrorsToSpace(
  functions: ICFVisualFunctionMetadata[]
): ICFVisualFunctionMetadata[] {
  return functions.map(func => {
    if (func.error) {
      func.error = ' ';
    }
    return func;
  });
}

const snippetNameRegex = /[^0-9A-Za-z_ ]/g;
export function transformSnippetName(snippetName: string) {
  return snippetName
    .replace(snippetNameRegex, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
