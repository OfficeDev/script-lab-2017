/* tslint:disable:no-namespace */

/** [PREVIEW] A collection of ScriptLab-specific helper functions (e.g., for authentication) for use by snippets,
 * necessary because some APIs (such as displayDialogAsync) cannot be used directly within Script Lab.
 */
module ScriptLab {
    /** [PREVIEW] Registers a custom functions with Excel (must be done via this helper in order to work correctly in Script Lab)
     * @param definitions: The function definitions, nested inside of an "Excel.CustomFunctionNamespaceCollection" data structure
     */
    export function registerCustomFunctions(definitions: Excel.CustomFunctionNamespaceCollection): void {
        merge(definitions, Excel.Script.CustomFunctions);

        function merge(data, target) {
            /* tslint:disable:forin */
            for (let ns in data) {
                target[ns] = target[ns] || {};

                for (let fn in data[ns]) {
                    if (target[ns][fn]) {
                        // TODO CUSTOM FUNCTIONS: localize and figure out how to expose this.
                        console.log(`Duplicate function name "${fn}" in namespace "${ns}"`);
                    }
                    target[ns][fn] = data[ns][fn];
                }
            }
            /* tslint:enable:forin */
        }
    }
}
