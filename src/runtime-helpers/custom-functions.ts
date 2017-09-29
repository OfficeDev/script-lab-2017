/* tslint:disable:no-namespace */

/** [PREVIEW] A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    /** [PREVIEW] Registers a custom functions with Excel (must be done via this helper in order to work correctly in Script Lab)
     * @param definitions: The function definitions, nested inside of an "Excel.CustomFunctionNamespaceCollection" data structure
     */
    export function registerCustomFunctions(definitions: Excel.CustomFunctionNamespaceCollection) {
    }
}
