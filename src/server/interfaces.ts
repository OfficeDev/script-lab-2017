export interface ISnippetHandlebarsContext extends ICompiledSnippet {
    isOfficeSnippet: boolean;
    isExternalExport: boolean;
    strings: ServerStrings;

    // For the runtime helpers, need both their URL, and the origin editor URL
    authHelpersUrl: string;
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

    host: string;
    isTrustedSnippet: boolean;

    initialLoadSubtitle: string;
    headerTitle: string;

    /** Office.js URL, or empty */
    officeJS: string;

    /** return url (for back button / errors), or empty
     * (in which case will come up with default editor URL, using host & id as guide) */
    returnUrl: string;

    strings: ServerStrings;
    explicitlySetDisplayLanguageOrNull: string;
}

export interface ICustomFunctionsRunnerHandlebarsContext {
    snippets: Array<ICustomFunctionsRelevantData>

    showUI: boolean;
    strings: ServerStrings;
}

export interface IErrorHandlebarsContext {
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
    host: string;
    pageTitle: string;
    initialLoadSubtitle: string;
    editorTryItUrl: string;
    wacUrl: string;
}
