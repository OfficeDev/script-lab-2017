export interface ITemplate {
    id?: string;
    gist?: string;
    author?: string;
    source?: string;
    name?: string;
    description?: string;
}

export interface ISnippet extends ITemplate {
    script?: {
        content: string;
        language: string;
    };
    template?: {
        content: string;
        language: string;
    };
    style?: {
        content: string;
        language: string;
    };
    libraries?: string;
}

interface IRunnerPostData {
    snippet: ISnippet | string; /* ISnippet when passed around, but string over the wire */
    returnUrl: string;
    refreshUrl: string;

    // Any further fields will simply get passed in to the refresh page:
    id: string;
    host: string;
    platform: string;
}

export interface IOuterTemplateData {
    snippetName: string;
    snippetAuthor: string;
    iframeContent: string;
    hostLowercase: string;
    returnUrl: string;
    refreshUrl: string;
    OfficeJsRefIfAny: string;
    isOfficeSnippet: boolean;
    addPaddingRight: boolean;
}