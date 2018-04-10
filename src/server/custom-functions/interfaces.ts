export interface IVisualMetadata {
    snippets: IVisualSnippetMetadata[];
};

export interface IVisualSnippetMetadata {
    name: string;
    functions: IVisualFunctionMetadata[];
    error?: boolean;
    status: CustomFunctionsRegistrationStatus;
};

export interface IVisualFunctionMetadata extends IFunctionMetadata {
    status: CustomFunctionsRegistrationStatus;
    paramString?: string;
};

export interface IVisualParameterMetadata extends IParameterMetadata {
    prettyType?: string;
};

export interface IFunctionMetadata {
    name: string;
    description?: string;
    parameters: IVisualParameterMetadata[];
    result: IFunctionResultMetadata;
    options: ICustomFunctionOptions;
    error?: string;
};

export interface IParameterMetadata {
    name: string;
    description?: string;
    type: CustomFunctionsSupportedTypes;
    dimensionality: CustomFunctionsDimensionality;
    error?: string;
};

export interface IFunctionResultMetadata {
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

