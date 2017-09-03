interface ITemplate {
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // NOTE: if you add or remove any top-level fields from this list, be sure
    // to update "snippetFields" and "snippetFieldSortingOrder" and "getSnippetDefaults" in
    // "src\client\app\helpers\snippet.helper.ts"
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    id?: string;
    gist?: string;
    gistOwnerId?: string;
    name?: string;
    description?: string;
    /** author: export-only */
    author?: string;
    host: string;
    /** api_set: export-only (+ check at first level of import) */
    api_set?: {
        [index: string]: number
    },
    platform: string;
    created_at: number;
    modified_at: number;
}

interface ISnippet extends ITemplate {
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // NOTE: if you add or remove any top-level fields from this list, be sure
    // to update "snippetFields" and "snippetFieldSortingOrder" and "getSnippetDefaults" in
    // "src\client\app\helpers\snippet.helper.ts"
    ///////////////////////////////////////////////////////////////////////////////////////////////////
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

interface ILibraryDefinition {
    label?: string;
    typings?: string | string[];
    value?: string | string[];
    description?: string
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

/** The request body passed to the runner during a POST */
interface IRunnerState {
    snippet: ISnippet;

    /** URL to return to (editor, or gallery view). More than just origin domain */
    returnUrl: string;

    displayLanguage: string;
}

interface IExportState {
    snippet: ISnippet;
    additionalFields: ISnippet;
    sanitizedFilenameBase: string;
    displayLanguage: string;
}

interface IMonacoEditorState {
    name?: string;
    displayName?: string;
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

declare var PLAYGROUND: ICompiledPlaygroundInfo;

interface ICompiledPlaygroundInfo {
    devMode: boolean;
    build: IBuildInfo;
    config: {
        local: IEnvironmentConfig,
        edge: IEnvironmentConfig,
        insiders: IEnvironmentConfig,
        production: IEnvironmentConfig
    };
    localStorageKeys: {
        originEnvironmentUrl: string;
        redirectEnvironmentUrl: string;
        playgroundCache: string;
    };
}

interface ICurrentPlaygroundInfo {
    devMode: boolean;
    build: IBuildInfo;
    config: IEnvironmentConfig;
    host?: string;
    platform?: string;
}

interface IBuildInfo {
    name: string;
    version: string;
    timestamp: string;
    author: string;
    humanReadableTimestamp: string;
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

interface ISettings {
    lastOpened: ISnippet,
    profile: IProfile,
    theme: boolean,
    language: string,
    env: string
}

interface HeartbeatParams {
    /** host (used for environment detection and to know which snippet store to read from) */
    host: string;

    /** snippet ID, if any */
    id: string;

    /** Snippet last modified timestamp, if relevant (comes in as a string on URL parameters)
     * If lastModified is empty or 0, the heartbeat will send the snippet back immediately;
    */
    lastModified: string;
}

// NOTE:  This interface must be kept in sync with the parameters to "_generateAuthUrl" in "runtime-helpers.ts"
interface AuthRequestParamData {
    auth_action: 'login' | 'logout';
    service: 'graph';
    client_id: string;
    is_office_host: boolean;
}
