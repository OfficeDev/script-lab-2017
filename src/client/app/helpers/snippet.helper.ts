import { forIn } from 'lodash';
import { environment } from './environment';
import { Strings } from './strings';

export enum SnippetFieldType {
    /** PUBLIC = Store internally, and also include in copy-to-clipboard */
    PUBLIC = 1 << 0,

    /** INTERNAL = Necessary to store, but not copy out */
    INTERNAL = 1 << 1,

    /** TRANSIENT = Only useful at runtime, needn't be stored at all */
    TRANSIENT = 1 << 2
}

const snippetFields: { [key: string]: SnippetFieldType; } = {
    /* ITemplate base class */
    id: SnippetFieldType.INTERNAL,
    gist: SnippetFieldType.INTERNAL,
    name: SnippetFieldType.PUBLIC,
    description: SnippetFieldType.PUBLIC,
    // author: export-only, always want to generate on the fly, so skip altogether
    host: SnippetFieldType.PUBLIC,
    api_set: SnippetFieldType.PUBLIC,
    platform: SnippetFieldType.TRANSIENT,
    origin: SnippetFieldType.TRANSIENT,
    created_at: SnippetFieldType.INTERNAL,
    modified_at: SnippetFieldType.INTERNAL,

    /* ISnippet */
    script: SnippetFieldType.PUBLIC,
    template: SnippetFieldType.PUBLIC,
    style: SnippetFieldType.PUBLIC,
    libraries: SnippetFieldType.PUBLIC
};

export function getSnippetDefaults(): ISnippet {
    return {
        id: '',
        gist: '',
        name: Strings.defaultSnippetTitle, // UI unknown (TODO: clarify what this comment meant)
        description: '',
        // author: export-only, always want to generate on the fly, so skip altogether
        host: environment.current.host,
        api_set: {},
        platform: environment.current.platform,
        origin: environment.current.config.editorUrl,
        created_at: Date.now(),
        modified_at: Date.now(),

        script: { content: '', language: 'typescript' },
        template: { content: '', language: 'html' },
        style: { content: '', language: 'css' },
        libraries: ''
    };
}

/** Returns a shallow copy of the snippet, filtered to only keep a particular set of fields */
export function getScrubbedSnippet(snippet: ISnippet, keep: SnippetFieldType): ISnippet {
    const copy = <any>{};
    forIn(snippetFields, (fieldType, fieldName) => {
        if (fieldType & keep) {
            copy[fieldName] = snippet[fieldName];
        }
    });

    return copy;
}
