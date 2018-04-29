import { parseMetadata } from './metadata.parser';
import {
    ICFFunctionMetadata,
    CustomFunctionsRegistrationStatus,
    ICFVisualSnippetMetadata,
    ICFVisualFunctionMetadata,
    ICFVisualMetadata,
} from './interfaces';


export function getFunctionsAndMetadataForRegistration(snippets: ISnippet[]): { visual: ICFVisualMetadata, functions: ICFFunctionMetadata[] } {
    const visualMetadata: ICFVisualSnippetMetadata[] = [];
    let metadata: ICFFunctionMetadata[] = [];

    snippets
        .filter(snippet => snippet.script && snippet.name)
        .forEach(snippet => {
            let functions: ICFVisualFunctionMetadata[] = parseMetadata(snippet.script.content, snippet.name) as ICFVisualFunctionMetadata[];
            functions = convertFunctionErrorsToSpace(functions);
            if (functions.length === 0) { return; } // no custom functions found
            const hasErrors = doesSnippetHaveErrors(functions);

            if (!hasErrors) {
                metadata = metadata.concat(...functions);
            }

            functions = functions.map(func => {

                func.parameters = func.parameters.map(p => {
                    return { ...p, prettyType: getPrettyType(p) };
                });

                const status = hasErrors ?
                    (func.error ?
                        CustomFunctionsRegistrationStatus.Error :
                        CustomFunctionsRegistrationStatus.Skipped) :
                    CustomFunctionsRegistrationStatus.Good;
                return {
                    ...func,
                    paramString: paramStringExtractor(func),
                    status,
                };
            });

            visualMetadata.push({
                name: snippet.name,
                error: hasErrors,
                status: hasErrors ? CustomFunctionsRegistrationStatus.Error : CustomFunctionsRegistrationStatus.Good,
                functions,
            });
        });

    const functions = filterOutDuplicates(metadata);
    const funcNames = functions.map(f => f.name);
    const visual = { snippets: tagDuplicatesAsErrors(visualMetadata, funcNames) };

    return { visual, functions };
}

// helpers

function getPrettyType(parameter) {
    if (parameter.error) {
        return '';
    }
    const dim = parameter.dimensionality === 'scalar' ? '' : '[][]';
    return `${parameter.type}${dim}`;
};

function paramStringExtractor(func) {
    if (func.error) {
        return undefined;
    }
    return func.parameters.map(p => {
        return `${p.name}: ${getPrettyType(p)}`;
    }).join(', ');
};

function doesSnippetHaveErrors(snippetMetadata) {
    return snippetMetadata.some(func => func.error);
};

function tagDuplicatesAsErrors(visualMetadata: ICFVisualSnippetMetadata[], nonDuplicatedFunctionNames: string[]): ICFVisualSnippetMetadata[] {
    return visualMetadata.map(meta => {
        let isError = meta.error;
        meta.functions = meta.functions.map(func => {
            if (!nonDuplicatedFunctionNames.includes(func.name) && !func.error) {
                func.error = ' - Duplicated function name. Must be unique across ALL snippets.';
                func.status = CustomFunctionsRegistrationStatus.Error;
                isError = true;
            }
            return func;
        });
        return { ...meta, error: isError, status: isError ? CustomFunctionsRegistrationStatus.Error : CustomFunctionsRegistrationStatus.Good };
    });
};

/**
 * This function converts all the `true` errors on the functions to ' '. This is because we still want it
 * to have a truthy value, but not show anything in the UI, and this is the best way I could manage that at this time.
 * @param functions
 */
function convertFunctionErrorsToSpace(functions: ICFVisualFunctionMetadata[]): ICFVisualFunctionMetadata[] {
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
};
