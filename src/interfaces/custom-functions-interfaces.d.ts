interface ICFVisualMetadata {
  snippets: ICFVisualSnippetMetadata[];
}

interface ICFVisualSnippetMetadata {
  name: string;
  functions: ICFVisualFunctionMetadata[];
  error?: boolean;
  status: CustomFunctionsRegistrationStatus;
}

interface ICFVisualParameterMetadata extends ICFSchemaParameterMetadata {
  prettyType?: string;
  error?: string;
}

interface ICFVisualFunctionResultMetadata extends ICFSchemaFunctionResultMetadata {
  error?: string;
}

interface ICFVisualFunctionMetadata /* doesn't extend ICFSchemaFunctionMetadata so as not to have "name" */ {
  /** The actual name of the function (no namespace/sub-namespace.  E.g., "add42") */
  funcName: string;

  // Sub-namespaced full name, not capitalized (e.g., "BlankSnippet1.add42") */
  nonCapitalizedFullName: string;

  status?: CustomFunctionsRegistrationStatus;
  paramString?: string;
  error?: string | boolean;

  description?: string;
  parameters: ICFVisualParameterMetadata[];
  result: ICFFunctionResultMetadata;
  options: ICustomFunctionOptions;
}

interface ICFSchemaFunctionMetadata {
  name: string;
  description?: string;
  parameters: ICFSchemaParameterMetadata[];
  result: ICFFunctionResultMetadata;
  options: ICustomFunctionOptions;
}

interface ICFSchemaParameterMetadata {
  name: string;
  description?: string;
  type: CustomFunctionsSupportedTypes;
  dimensionality: CustomFunctionsDimensionality;
}

interface ICFSchemaFunctionResultMetadata {
  dimensionality: CustomFunctionsDimensionality;
  type: CustomFunctionsSupportedTypes;
}

interface ICFSchemaFunctionOptions {
  sync: boolean;
  stream: boolean;
  volatile: boolean;
  cancelable: boolean;
}

type CustomFunctionsSchemaSupportedTypes = 'number' | 'string' | 'boolean' | 'invalid';
type CustomFunctionsSchemaDimensionality = 'invalid' | 'scalar' | 'matrix';

type CustomFunctionsRegistrationStatus = 'good' | 'skipped' | 'error' | 'untrusted';

/** The interface used by Excel to register custom functions (workbook.registerCustomFunctions(...))  */
interface ICustomFunctionsRegistrationApiMetadata {
  functions: ICFSchemaFunctionMetadata[];
}

interface ICustomFunctionsHeartbeatParams {
  clientTimestamp: number;
}

interface ICustomFunctionsRunnerRelevantData {
  name: string;
  id: string;
  libraries: string;
  script: IContentLanguagePair;
  metadata: ICustomFunctionsSnippetRegistrationData;
}

interface ICustomFunctionsSnippetRegistrationData {
  namespace: string;
  functions: ICFVisualFunctionMetadata[];
}

interface ICustomFunctionsMetadataRequestPostData {
  snippets: ISnippet[];
}

interface IRunnerCustomFunctionsPostData {
  snippets: ICustomFunctionsRunnerRelevantData[];
  displayLanguage: string;
  heartbeatParams: ICustomFunctionsHeartbeatParams;
  experimentationFlags: ExperimentationFlags;
}
