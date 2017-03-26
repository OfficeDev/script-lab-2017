interface ITemplate {
    id?: string;
    gist?: string;
    author?: string;
    name?: string;
    description?: string;
    host: string;
    api_set: {
        [index: string]: number
    },
    platform: string;
    origin: string;
    created_at: number;
    modified_at: number;
}

interface ILibraryDefinition {
    label?: string;
    typings?: string | string[];
    value?: string | string[];
    description?: string
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
}

interface ICompiledSnippet extends ITemplate {
    script?: string;
    style?: string;
    template?: string;
    scriptReferences?: string[];
    linkReferences?: string[];
    officeJS?: string;
    typings?: string[];
}

interface IRunnerHandlebarsContext {
    /** Snippet info (or null, to signify "opportunistic" runner that attaches to anything open) */
    snippet: {
        id: string,

        /** Last modified (or 0, if want to load from scratch) */
        lastModified?: number

        /** Snippet contents (or empty, if want to read it off of the ID using the heartbeat) */
        content?: string;
    }

    origin: string;
    host: string;

    initialLoadSubtitle: string;
    headerTitle: string;

    /** Office.js URL, or empty */
    officeJS: string;

    /** return url (for back button / errors), or empty */
    returnUrl: string;
}

interface IRunnerState {
    snippet: ISnippet;

    /** URL to return to (editor, or gallery view). More than just origin domain */
    returnUrl: string;
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
    devMode?: boolean;
    build?: {
        name: string;
        version: string;
        timestamp: string;
        author: string;
    },
    config?: IEnvironmentConfig
    host?: string,
    platform?: string
}

interface IEnvironmentConfig {
    name: string,
    clientId: string
    instrumentationKey: string,
    editorUrl: string,
    tokenUrl: string,
    runnerUrl: string,
    feedbackUrl: string,
    samplesUrl: string
}

declare var PLAYGROUND: IEnvironment;

interface ISettings {
    lastOpened: ISnippet,
    profile: IProfile,
    theme: boolean,
    language: string,
    env: string
}

interface HeartbeatParams {
    /** mode (equivalent to "host" in this case -- used for environment detection) */
    mode: string;

    /** snippet ID, if any */
    id: string;

    /** snippet last modified, if relevant (comes in as a string on URL parameters) */
    lastModified: string;
}
