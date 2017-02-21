interface ITemplate {
    id?: string;
    gist?: string;
    author?: string;
    source?: string;
    name?: string;
    description?: string;
}

interface ISnippet extends ITemplate {
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
    lastModified?: number;
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

interface IMonacoEditorState {
    name?: string;
    view?: string;
    content?: string;
    language?: string;
    viewState?: monaco.editor.IEditorViewState;
    model?: monaco.editor.IModel;
}

interface IAlert {
    title: string;
    message: string;
    actions: string[];
}

interface ITab {
    name?: string,
    language?: string,
    content?: string
}

interface IEvent<T> {
    type: string,
    action: number,
    data: T
}

interface IEnvironment {
    devMode: boolean;
    build: {
        name: string;
        version: string;
        timestamp: number;
        author: string;
    },
    config: {
        [env: string]: IEnvironmentConfig
    },
    host?: string,
    platform?: string
}

interface IEnvironmentConfig {
    name: string,
    clientId: string
    instrumentationKey: string,
    tokenUrl: string,
    runnerUrl: string,
    feedbackUrl: string,
    samplesUrl: string
}

interface ISettings {
    lastOpened: ISnippet,
    profile: IProfile,
    theme: boolean,
    language: string,
    env: string
}

interface IOuterTemplateData {
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