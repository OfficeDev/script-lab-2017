interface ITemplate {
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // NOTE: if you add or remove any top-level fields from this list, be sure
    // to update "snippetFields" and "snippetFieldSortingOrder" and "getSnippetDefaults" in
    // "src\client\app\helpers\snippet.helper.ts"
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    id?: string;
    gist?: string;
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
    origin: string;
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

interface ISnippetHandlebarsContext extends ICompiledSnippet {
    isOfficeSnippet: boolean;
    isExternalExport: boolean;
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

/** The request body passed to the runner during a POST */
interface IRunnerState {
    snippet: ISnippet;

    /** URL to return to (editor, or gallery view). More than just origin domain */
    returnUrl: string;
}

interface IExportState {
    snippet: ISnippet;
    additionalFields: ISnippet;
    sanitizedFilenameBase: string;
}

interface IErrorHandlebarsContext {
    origin: string;
    title: string;
    message: string;
    details: string;
    expandDetailsByDefault: boolean;
}

interface IManifestHandlebarsContext {
    name: string;
    description: string;
    hostType: string;
    htmlFilename: string;
    supportsAddinCommands: boolean;
    snippetNameMax125: string;
    snippetDescriptionMax250: string;
    providerName: string;
    guid: string;
}

interface IReadmeHandlebarsContext {
    name: string;
    description: string;
    exportedOn: string;
    isAddin: boolean;
    addinOrWebpage: 'Add-in' | 'webpage';
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
        humanReadableTimestamp: string;
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
    /** host (used for environment detection and to know which snippet store to read from) */
    host: string;

    /** snippet ID, if any */
    id: string;

    /** Snippet last modified timestamp, if relevant (comes in as a string on URL parameters)
     * If lastModified is empty or 0, the heartbeat will send the snippet back immediately;
    */
    lastModified: string;
}
