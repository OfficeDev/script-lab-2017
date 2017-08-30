export interface ISnippetHandlebarsContext extends ICompiledSnippet {
    isOfficeSnippet: boolean;
    isExternalExport: boolean;
    strings: ServerStrings;

    // For the runtime helpers, need both their URL, and the origin editor URL
    runtimeHelpersUrl: string;
    editorUrl: string;
    runtimeHelperStringifiedStrings: string;
}

export interface IRunnerHandlebarsContext {
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
    assets: { [key: string]: any };
    isTrustedSnippet: boolean;

    initialLoadSubtitle: string;
    headerTitle: string;

    /** Office.js URL, or empty */
    officeJS: string;

    /** return url (for back button / errors), or empty */
    returnUrl: string;

    strings: ServerStrings;
    explicitlySetDisplayLanguageOrNull: string;
}

export interface IErrorHandlebarsContext {
    origin: string;
    assets: { [key: string]: any };
    title: string;
    message: string;
    details: string;
    expandDetailsByDefault: boolean;
}

export interface IManifestHandlebarsContext {
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

export interface IReadmeHandlebarsContext {
    name: string;
    description: string;
    exportedOn: string;
    isAddin: boolean;
    addinOrWebpage: 'Add-in' | 'webpage';
}

export interface ITryItHandlebarsContext {
    title: string;
    assets: { [key: string]: any };
    origin: string;
    editorTryItUrl: string;
    runnerSnippetUrl: string;
    wacUrl: string;
}
