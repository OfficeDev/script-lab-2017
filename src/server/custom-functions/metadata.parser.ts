import * as ts from 'typescript';

/* tslint:disable:no-reserved-keywords */
const DEFAULT_HELP_URL = 'https://dev.office.com';

const CUSTOM_FUNCTION = 'customfunction';

const TYPE_MAPPINGS = {
    [ts.SyntaxKind.NumberKeyword] : 'number',
    [ts.SyntaxKind.StringKeyword] : 'string',
    [ts.SyntaxKind.BooleanKeyword] : 'boolean',
};

const INVALID = 'invalid';

enum Dimensionality {
    Invalid = 'invalid',
    Scalar = 'scalar',
    Matrix = 'matrix',
}

type CustomFunctionParameters = {
    sync: boolean;
    stream: boolean;
    volatile: boolean;
    cancelable: boolean;
};

const CUSTOM_FUNCTION_CONFIGURATIONS = ['sync', 'stream', 'volatile'];

const CUSTOM_FUNCTION_DEFAULT_CONF: CustomFunctionParameters = {
    sync: false,
    stream: false,
    volatile: false,
    cancelable: true,
};

/**
 * This function parses out the sync, stream, volatile, and cancelable parameters out of the JSDoc.
 * @param func - The @customfunction that we want to parse out the various parameters out of.
 */
function parseCustomFunctionParameters(func: ts.FunctionDeclaration): CustomFunctionParameters {
    const params = {...CUSTOM_FUNCTION_DEFAULT_CONF}; // create a copy of default values

    ts.getJSDocTags(func).forEach((tag: ts.JSDocTag) => {
        const loweredTag = (tag.tagName.escapedText as string).toLowerCase();
        if (CUSTOM_FUNCTION_CONFIGURATIONS.indexOf(loweredTag) !== -1) {
            params[loweredTag] = true;
        }
    });

    return params;
}

/**
 * This method will parse out all of the @param tags of a JSDoc and return an
 * @param node - The function to parse the JSDoc params from
 */
function getJSDocParams(node: ts.Node): {[key: string]: string} {
    const jsDocParamInfo = {};

    ts.getAllJSDocTagsOfKind(node, ts.SyntaxKind.JSDocParameterTag)
        .forEach((tag: ts.JSDocParameterTag) => {
            const comment = (tag.comment.startsWith('-') ? tag.comment.slice(1) : tag.comment).trim();

            return jsDocParamInfo[(tag as ts.JSDocPropertyLikeTag).name.getFullText()] = comment;
        });

    return jsDocParamInfo;
}

/**
 * This function will return `true` for `Array<[object]>` and `false` otherwise.
 * @param a - TypeReferenceNode
 */
function validateArray(a: ts.TypeReferenceNode) {
    return (a.typeName.getText() === 'Array' &&
            a.typeArguments &&
            a.typeArguments.length === 1);
}

/**
 * This function takes in a parameter or function return TypeNode and validates that it's type
 * is one of our supported types for custom functions.
 * @param t - The node we are parsing and validating the type of
 */
function getTypeAndDimensionalityForParam(t: ts.TypeNode | undefined): {dimensionality: Dimensionality; type: string; error?: string} {

    const errTypeAndDim = {
        dimensionality: Dimensionality.Invalid,
        type: INVALID,
    };

    if (t === undefined) {
        return { error: 'No type specified.', ...errTypeAndDim };
    }


    const invalidTypeError = {
        error: `Invalid type specified: ${t.getText()}. Supported types include: string, number, boolean, or a 2D array of one of these.`,
        ...errTypeAndDim,
    };

    let dimensionality = Dimensionality.Scalar;
    let kind = t.kind;

    if (ts.isTypeReferenceNode(t)) {
        dimensionality = Dimensionality.Matrix;

        const arrTr = t as ts.TypeReferenceNode;

        if (arrTr.typeName.getText() !== 'Array') {
            return invalidTypeError;
        }

        if (validateArray(t) &&
            ts.isTypeReferenceNode(arrTr.typeArguments[0])) {

            const inner = arrTr.typeArguments[0] as ts.TypeReferenceNode;

            if (!validateArray(inner) || inner.typeName.getText() !== 'Array') {
                return invalidTypeError;
            }

            kind = inner.typeArguments[0].kind;
        }

    } else if (ts.isArrayTypeNode(t)) {
        dimensionality = Dimensionality.Matrix;

        const inner = (t as ts.ArrayTypeNode).elementType;

        if (!ts.isArrayTypeNode(inner)) {
            return invalidTypeError;
        }

        kind = inner.elementType.kind;

    }

    const type = TYPE_MAPPINGS[kind];

    if (!type) {
        return invalidTypeError;
    }

    return {dimensionality, type};

}

function traverseAST(sourceFile: ts.SourceFile): {[key: string] : any}[] {
    const metadata = [];

    visitNode(sourceFile);

    return metadata;

    function getDimAndTypeHelper(t: ts.TypeNode): {dimensionality: Dimensionality; type: string, error?: string} {
        try {
            return getTypeAndDimensionalityForParam(t);
        } catch (e) {
            return {
                error: e.message,
                dimensionality: Dimensionality.Invalid,
                type: INVALID
            };
        }
    }

    function visitNode(node: ts.Node) {

        switch (node.kind) {
            case ts.SyntaxKind.FunctionDeclaration:
                if (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile) {
                    const func = node as ts.FunctionDeclaration;

                    const isCF = ts.getJSDocTags(func)
                                   .filter((tag: ts.JSDocTag) => (tag.tagName.escapedText as string).toLowerCase() === CUSTOM_FUNCTION)
                                   .length > 0;

                    if (isCF) {
                        const jsDocParamInfo = getJSDocParams(func);

                        const parameters = func.parameters.map((p: ts.ParameterDeclaration) => {
                            const name = (p.name as ts.Identifier).text;

                            return {
                                name,
                                ...(jsDocParamInfo[name] ? {description: jsDocParamInfo[name]} : {}),
                                ...getDimAndTypeHelper(p.type),
                            };
                        });

                        //tslint:disable-next-line
                        const description = (func as any).jsDoc ? (func as any).jsDoc[0].comment : undefined;

                        let result;
                        if (func.type) {
                            result = getDimAndTypeHelper(func.type);
                        } else {
                            result = {
                                error: 'No return type specified.',
                                dimensionality: Dimensionality.Invalid,
                                type: INVALID
                            };
                        }

                        const metadataItem = {
                            name: func.name.text,
                            ...(description ? {description} : {}),
                            helpUrl: DEFAULT_HELP_URL,
                            parameters,
                            result,
                            options: parseCustomFunctionParameters(func),
                        };

                        const funcContainsErrors = result.error || parameters.some(p => p.error !== undefined);
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

        ts.forEachChild(node, visitNode);
    }
}

/**
 * This function parses out the metadata for the various @customfunction's defined in the `fileContent`.
 * It will either either return an array of metadata objects, or throw a JSON.stringified error object if there are errors/unsupported types.
 * @param fileContent - The string content of the typescript file to parse the custom functions metadata out of.
 */
export function parseMetadata(fileContent: string) : {[key: string] : any}[] {
    const sourceFile = ts.createSourceFile('someFileName', fileContent, ts.ScriptTarget.ES2015, true);

    return traverseAST(sourceFile);
}