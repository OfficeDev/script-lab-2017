interface ICFVisualMetadata {
  snippets: ICFVisualSnippetMetadata[];
}

interface ICFVisualSnippetMetadata {
  name: string;
  functions: ICFVisualFunctionMetadata[];
  error?: boolean;
  status: CustomFunctionsRegistrationStatus;
}

interface ICFVisualFunctionMetadata extends ICFFunctionMetadata {
  status: CustomFunctionsRegistrationStatus;
  paramString?: string;
}

interface ICFVisualParameterMetadata extends ICFParameterMetadata {
  prettyType?: string;
}

interface ICFFunctionMetadata {
  name: string;
  description?: string;
  parameters: ICFVisualParameterMetadata[];
  result: ICFFunctionResultMetadata;
  options: ICustomFunctionOptions;
  error?: string;
}

interface ICFParameterMetadata {
  name: string;
  description?: string;
  type: CustomFunctionsSupportedTypes;
  dimensionality: CustomFunctionsDimensionality;
  error?: string;
}

interface ICFFunctionResultMetadata {
  dimensionality: CustomFunctionsDimensionality;
  type: CustomFunctionsSupportedTypes;
  error?: string;
}

interface ICustomFunctionOptions {
  sync: boolean;
  stream: boolean;
  volatile: boolean;
  cancelable: boolean;
}

type CustomFunctionsSupportedTypes = 'number' | 'string' | 'boolean' | 'invalid';
type CustomFunctionsRegistrationStatus = 'good' | 'skipped' | 'error' | 'untrusted';

type CustomFunctionsDimensionality = 'invalid' | 'scalar' | 'matrix';

interface ICFFunctionMetadata {
  name: string;
  description?: string;
  parameters: ICFVisualParameterMetadata[];
  result: ICFFunctionResultMetadata;
  options: ICustomFunctionOptions;
  error?: string;
}

interface ICFParameterMetadata {
  name: string;
  description?: string;
  type: CustomFunctionsSupportedTypes;
  dimensionality: CustomFunctionsDimensionality;
  error?: string;
}

/** The interface used by Excel to register custom functions (workbook.registerCustomFunctions(...))  */
interface ICustomFunctionsRegistrationApiMetadata {
  functions: ICFFunctionMetadata[];
}

interface ICustomFunctionsSnippetRegistrationData {
  namespace: string;
  functions: ICFFunctionMetadata[];
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

interface ICustomFunctionsMetadataRequestPostData {
  snippets: ISnippet[];
}

interface IRunnerCustomFunctionsPostData {
  snippets: ICustomFunctionsRunnerRelevantData[];
  displayLanguage: string;
  heartbeatParams: ICustomFunctionsHeartbeatParams;
  experimentationFlags: ExperimentationFlags;
}
