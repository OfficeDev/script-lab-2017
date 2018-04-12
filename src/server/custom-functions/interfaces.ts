export interface ICFVisualMetadata {
    snippets: ICFVisualSnippetMetadata[];
};

export interface ICFVisualSnippetMetadata {
    name: string;
    functions: ICFVisualFunctionMetadata[];
    error?: boolean;
    status: CustomFunctionsRegistrationStatus;
};

export interface ICFVisualFunctionMetadata extends ICFFunctionMetadata {
    status: CustomFunctionsRegistrationStatus;
    paramString?: string;
};

export interface ICFVisualParameterMetadata extends ICFParameterMetadata {
    prettyType?: string;
};

export interface ICFFunctionMetadata {
    name: string;
    description?: string;
    parameters: ICFVisualParameterMetadata[];
    result: ICFFunctionResultMetadata;
    options: ICustomFunctionOptions;
    error?: string;
};

export interface ICFParameterMetadata {
    name: string;
    description?: string;
    type: CustomFunctionsSupportedTypes;
    dimensionality: CustomFunctionsDimensionality;
    error?: string;
};

export interface ICFFunctionResultMetadata {
    dimensionality: CustomFunctionsDimensionality;
    type: CustomFunctionsSupportedTypes;
    error?: string;
};

export interface ICustomFunctionOptions {
    sync: boolean;
    stream: boolean;
    volatile: boolean;
    cancelable: boolean;
};

export enum CustomFunctionsSupportedTypes {
    Number = 'number',
    String = 'string',
    Boolean = 'boolean',
};

export enum CustomFunctionsRegistrationStatus {
    Good = 'good',
    Skipped = 'skipped',
    Error = 'error',
};

export enum CustomFunctionsDimensionality {
    Invalid = 'invalid',
    Scalar = 'scalar',
    Matrix = 'matrix',
};

