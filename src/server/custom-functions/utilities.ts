import { parseMetadata } from './metadata.parser';
import { transformSnippetName } from '../core/snippet.helper';
import { compileScript } from '../core/snippet.generator';

export function getCustomFunctionsInfoForRegistration(
  snippets: ISnippet[],
  strings: ServerStrings
): { visual: ICFVisualMetadata; functions: ICFFunctionMetadata[]; code: string[] } {
  const visualMetadata: ICFVisualSnippetMetadata[] = [];
  let metadata: ICFFunctionMetadata[] = [];
  const code: string[] = [];

  snippets.filter(snippet => snippet.script && snippet.name).forEach(snippet => {
    let functions: ICFVisualFunctionMetadata[] = parseMetadata(
      snippet.script.content
    ) as ICFVisualFunctionMetadata[];

    functions = convertFunctionErrorsToSpace(functions);
    if (functions.length === 0) {
      return;
    } // no custom functions found
    let hasErrors = doesSnippetHaveErrors(functions);

    let snippetCode: string;
    if (!hasErrors) {
      try {
        snippetCode = compileScript(snippet.script, strings);
      } catch (e) {
        functions.forEach(f => (f.error = 'Snippet compiler error'));
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      const namespace = transformSnippetName(snippet.name);
      const namespacedFunctions = functions.map(f => ({
        ...f,
        originalName: f.name,
        name: `${namespace}.${f.name}`,
      }));
      metadata = metadata.concat(...namespacedFunctions);

      code.push(
        wrapCustomFunctionSnippetCode(snippetCode, namespace, functions.map(f => f.name))
      );
    }

    functions = functions.map(func => {
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
      functions,
    });
  });

  const functions = filterOutDuplicates(metadata);
  const visual = { snippets: visualMetadata };

  return { visual, functions, code };
}

// helpers

function wrapCustomFunctionSnippetCode(
  code: string,
  namespace: string,
  functionNames: string[]
): string {
  return [
    `(() => {`,
    ...code.split('\n').map(line => '\t' + line),
    ...functionNames.map(
      name =>
        '\t' +
        `CustomFunctionMappings["${namespace.toUpperCase()}.${name.toUpperCase()}"] = name`
    ),
    `})`,
  ].join('\n');
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

function filterOutDuplicates(functions: ICFFunctionMetadata[]): ICFFunctionMetadata[] {
  return functions.filter(func => {
    return functions.filter(f => f.name === func.name).length === 1;
  });
}
