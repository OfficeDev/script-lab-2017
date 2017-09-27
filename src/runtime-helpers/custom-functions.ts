/* tslint:disable:no-namespace */

/** [PREVIEW] A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    /** [PREVIEW] Gets an access token on behalf of the user for a particular service
     * @param definitions: The function definitions, nested inside of an
     * "Excel.CustomFunctionNamespaceCollection" data structure
     */

    export function registerCustomFunctions() {

    }
}

interface CustomFunctionNamespaceCollection {
    [index: string]: CustomFunctionDefinitionCollection;
}
interface CustomFunctionDefinitionCollection {
    [index: string]: CustomFunctionDefinition;
}
interface CustomFunctionDefinition {
    call: Function;
    description?: string;
    helpUrl?: string;
    result: CustomFunctionResult;
    parameters: Array<CustomFunctionParameter>;
    options?: CustomFunctionOptions;
}
interface CustomFunctionResult {
    resultType: string;
    resultDimensionality?: string;
}
interface CustomFunctionOptions {
    batch?: boolean;
    stream?: boolean;
}
/**
 *
 * Custom function parameter declaration.
 *
 * [Api set: ExcelApi 1.7 (PREVIEW)]
 */
interface CustomFunctionParameter {
    /**
     *
     * Useful description of the parameter.
     *
     * [Api set: ExcelApi 1.7 (PREVIEW)]
     */
    description: string;
    /**
     *
     * The name of the parameter.
     *
     * [Api set: ExcelApi 1.7 (PREVIEW)]
     */
    name: string;
    /**
     *
     * The dimensionality of parameter value.
     *
     * [Api set: ExcelApi 1.7 (PREVIEW)]
     */
    valueDimensionality: string;
    /**
     *
     * The type of parameter value.
     *
     * [Api set: ExcelApi 1.7 (PREVIEW)]
     */
    valueType: string;
}
