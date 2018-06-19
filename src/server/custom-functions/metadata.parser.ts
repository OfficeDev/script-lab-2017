import * as ts from 'typescript';
import { isUndefined } from 'lodash';

/* tslint:disable:no-reserved-keywords */
const CUSTOM_FUNCTION = 'customfunction'; // case insensitive @CustomFunction tag to identify custom functions in JSDoc

const TYPE_MAPPINGS = {
  [ts.SyntaxKind.NumberKeyword]: 'number',
  [ts.SyntaxKind.StringKeyword]: 'string',
  [ts.SyntaxKind.BooleanKeyword]: 'boolean',
};

const CUSTOM_FUNCTION_OPTIONS_KEYS = ['cancelable', 'volatile'];

const CUSTOM_FUNCTION_DEFAULT_OPTIONS: ICustomFunctionOptions = {
  sync: true,
  stream: false,
  volatile: false,
  cancelable: false,
};

/**
 * This function parses out the metadata for the various @customfunction's defined in the `fileContent`.
 * It will either either return an array of metadata objects, or throw a JSON.stringified error object if there are errors/unsupported types.
 * @param fileContent - The string content of the typescript file to parse the custom functions metadata out of.
 */
export function parseMetadata(fileContent: string): ICFFunctionMetadata[] {
  const sourceFile = ts.createSourceFile(
    'someFileName',
    fileContent,
    ts.ScriptTarget.ES2015,
    true
  );

  return traverseAST(sourceFile);
}

function traverseAST(sourceFile: ts.SourceFile): ICFFunctionMetadata[] {
  const metadata = [];
  visitNode(sourceFile);
  return metadata;

  function visitNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        if (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile) {
          const func = node as ts.FunctionDeclaration;

          const isCF =
            ts
              .getJSDocTags(func)
              .filter(
                (tag: ts.JSDocTag) =>
                  (tag.tagName.escapedText as string).toLowerCase() === CUSTOM_FUNCTION
              ).length > 0;

          if (isCF) {
            const jsDocParamInfo = getJSDocParams(func);

            const [lastParameter] = func.parameters.slice(-1);
            const isStreamingFunction = checkLastParameterForStreaming(lastParameter);

            const parameters = func.parameters
              .map((p: ts.ParameterDeclaration, i: number) => {
                if (isStreamingFunction && i === func.parameters.length - 1) {
                  return null;
                }
                const name = (p.name as ts.Identifier).text;

                return {
                  name,
                  ...(jsDocParamInfo[name] ? { description: jsDocParamInfo[name] } : {}),
                  ...getDimAndTypeHelper(p.type),
                };
              })
              .filter(meta => meta);

            let description;
            if ((func as any).jsDoc) {
              description = (func as any).jsDoc[0].comment;
            }

            let result: {
              dimensionality: CustomFunctionsDimensionality;
              error?: string;
              type: CustomFunctionsSupportedTypes;
            };
            if (isStreamingFunction) {
              const lastParameterType = lastParameter.type as ts.TypeReferenceNode;
              if (
                !lastParameterType.typeArguments ||
                lastParameterType.typeArguments.length !== 1
              ) {
                result = {
                  error:
                    'One and only one argument should be specified to IInvocationContext',
                  dimensionality: 'invalid',
                  type: 'invalid',
                };
              } else {
                result = getDimAndTypeHelper(lastParameterType.typeArguments[0]);
              }
            } else if (func.type) {
              if (
                func.type.kind === ts.SyntaxKind.TypeReference &&
                (func.type as ts.TypeReferenceNode).typeName.getText() === 'Promise' &&
                (func.type as ts.TypeReferenceNode).typeArguments &&
                (func.type as ts.TypeReferenceNode).typeArguments.length === 1
              ) {
                result = getDimAndTypeHelper(
                  (func.type as ts.TypeReferenceNode).typeArguments[0]
                );
              } else {
                result = getDimAndTypeHelper(func.type);
              }
            } else {
              result = {
                error: 'No return type specified.',
                dimensionality: 'invalid',
                type: 'invalid',
              };
            }

            let options = parseCustomFunctionOptions(func);
            if (
              func.modifiers &&
              func.modifiers.length > 1 &&
              func.modifiers[0].kind === ts.SyntaxKind.AsyncKeyword
            ) {
              options.sync = true;
            }

            if (isStreamingFunction) {
              options.stream = true;
            }

            const metadataItem = {
              name: func.name.text,
              description,
              parameters,
              result,
              options,
            };
            if (!metadataItem.description) {
              delete metadataItem.description;
            }

            const funcContainsErrors =
              result.error || parameters.some(p => !isUndefined(p.error));
            if (funcContainsErrors) {
              metadataItem['error'] = true;
            }

            metadata.push(metadataItem);
          }
        }
        break;
      default:
        break;
    }

    // Recursively call itself (but note that will only pick up functions at top level,
    // since the first check is whether the node's parent is a source file)
    ts.forEachChild(node, visitNode);
  }
}

// helpers

function checkLastParameterForStreaming(param: ts.ParameterDeclaration): boolean {
  if (!ts.isTypeReferenceNode(param.type)) {
    return false;
  }

  const typeRef = param.type as ts.TypeReferenceNode;
  return typeRef.typeName.getText() === 'IInvocationContext';
}

function getDimAndTypeHelper(
  t: ts.TypeNode
): {
  dimensionality: CustomFunctionsDimensionality;
  type: CustomFunctionsSupportedTypes;
  error?: string;
} {
  try {
    return getTypeAndDimensionalityForParam(t);
  } catch (e) {
    return {
      error: e.message,
      dimensionality: 'invalid',
      type: 'invalid',
    };
  }
}

/**
 * This function parses out the sync, stream, volatile, and cancelable parameters out of the JSDoc.
 * @param func - The @customfunction that we want to parse out the various parameters out of.
 */
function parseCustomFunctionOptions(
  func: ts.FunctionDeclaration
): ICustomFunctionOptions {
  const params = { ...CUSTOM_FUNCTION_DEFAULT_OPTIONS }; // create a copy of default values

  ts.getJSDocTags(func).forEach((tag: ts.JSDocTag) => {
    const loweredTag = (tag.tagName.escapedText as string).toLowerCase();
    if (CUSTOM_FUNCTION_OPTIONS_KEYS.indexOf(loweredTag) !== -1) {
      params[loweredTag] = true;
    }
  });

  return params;
}

/**
 * This method will parse out all of the @param tags of a JSDoc and return a dictionary
 * @param node - The function to parse the JSDoc params from
 */
function getJSDocParams(node: ts.Node): { [key: string]: string } {
  const jsDocParamInfo = {};

  ts.getAllJSDocTagsOfKind(node, ts.SyntaxKind.JSDocParameterTag).forEach(
    (tag: ts.JSDocParameterTag) => {
      const comment = (tag.comment.startsWith('-')
        ? tag.comment.slice(1)
        : tag.comment
      ).trim();

      jsDocParamInfo[(tag as ts.JSDocPropertyLikeTag).name.getFullText()] = comment;
    }
  );

  return jsDocParamInfo;
}

/**
 * This function will return `true` for `Array<[object]>` and `false` otherwise.
 * @param a - TypeReferenceNode
 */
function validateArray(a: ts.TypeReferenceNode) {
  return (
    a.typeName.getText() === 'Array' && a.typeArguments && a.typeArguments.length === 1
  );
}

/**
 * This function takes in a parameter or function return TypeNode and validates that it's type
 * is one of our supported types for custom functions.
 * @param t - The node we are parsing and validating the type of
 */
function getTypeAndDimensionalityForParam(
  t: ts.TypeNode | undefined
): {
  dimensionality: CustomFunctionsDimensionality;
  type: CustomFunctionsSupportedTypes;
  error?: string;
} {
  const errTypeAndDim = {
    dimensionality: 'invalid' as CustomFunctionsDimensionality,
    type: 'invalid' as CustomFunctionsSupportedTypes,
  };

  if (isUndefined(t)) {
    return { error: 'No type specified.', ...errTypeAndDim };
  }

  const invalidTypeError = {
    error: `Invalid type specified: ${t.getText()}. Supported types include: string, number, boolean, or a 2D array of one of these.`,
    ...errTypeAndDim,
  };

  let dimensionality: CustomFunctionsDimensionality = 'scalar';
  let kind = t.kind;

  if (ts.isTypeReferenceNode(t)) {
    dimensionality = 'matrix';

    const arrTr = t as ts.TypeReferenceNode;

    if (arrTr.typeName.getText() !== 'Array') {
      return invalidTypeError;
    }

    const isArrayWithTypeRefWithin =
      validateArray(t) && ts.isTypeReferenceNode(arrTr.typeArguments[0]);

    if (isArrayWithTypeRefWithin) {
      const inner = arrTr.typeArguments[0] as ts.TypeReferenceNode;

      if (!validateArray(inner)) {
        return invalidTypeError;
      }

      kind = inner.typeArguments[0].kind;
    }
  } else if (ts.isArrayTypeNode(t)) {
    dimensionality = 'matrix';

    const inner = (t as ts.ArrayTypeNode).elementType;

    if (!ts.isArrayTypeNode(inner)) {
      return invalidTypeError;
    }

    // Expectation is that at this point, "kind" is a primitive type (not 3D array).
    // However, if not, the TYPE_MAPPINGS check below will fail.
    kind = inner.elementType.kind;
  }

  const type = TYPE_MAPPINGS[kind];

  if (!type) {
    return invalidTypeError;
  }

  return { dimensionality, type };
}
