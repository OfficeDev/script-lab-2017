////////////////////////////////////////////////////////////////////////////////////
/// NOTE: A portion (everything except "getSnippetDefaults") is also used in the ///
///       Script Lab Samples project.  Please be sure that any changes that you  ///
///       make here are also copied to there. See "config/snippet.helpers.ts"    ///
///       in https://github.com/OfficeDev/script-lab-samples                     ///
///                                                                              ///
///       That same shared portion is also used in the "server" portion of this  ///
///       project (src\server\core\snippet.helper.ts). Please ensure that these  ///
///       copies stay in sync as well.                                           ///
////////////////////////////////////////////////////////////////////////////////////

import * as jsyaml from 'js-yaml';
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

const snippetFields: { [key: string]: SnippetFieldType } = {
    /* ITemplate base class */
    id: SnippetFieldType.INTERNAL,
    gist: SnippetFieldType.INTERNAL,
    name: SnippetFieldType.PUBLIC,
    description: SnippetFieldType.PUBLIC,
    // author: export-only, always want to generate on the fly, so skip altogether
    host: SnippetFieldType.PUBLIC,
    // api_set: export-only, always want to generate on the fly, so skip altogether
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

export const snippetFieldSortingOrder: { [key: string]: number } = {
    /* Sample-exported fields */
    order: 1,
    id: 2,

    /* ITemplate base class */
    name: 11,
    description: 12,
    author: 13,
    host: 14,
    api_set: 15,

    /* ISnippet */
    script: 110,
    template: 111,
    style: 112,
    libraries: 113,

    /* And within scripts / templates / styles, content should always be before language */
    content: 1000,
    language: 1001
};

export function getSnippetDefaults(): ISnippet {
    return {
        id: '',
        gist: '',
        name: Strings.defaultSnippetTitle, // UI unknown (TODO: clarify what this comment meant)
        description: '',
        // author: export-only, always want to generate on the fly, so skip altogether
        host: environment.current.host,
        // api_set: export-only, always want to generate on the fly, so skip altogether
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
    let copy = {};
    forIn(snippetFields, (fieldType, fieldName) => {
        if (fieldType & keep) {
            copy[fieldName] = snippet[fieldName];
        }
    });

    return copy as ISnippet;
}

export function getShareableYaml(rawSnippet: ISnippet, additionalFields: ISnippet) {
    const snippet = { ...getScrubbedSnippet(rawSnippet, SnippetFieldType.PUBLIC), ...additionalFields };

    return jsyaml.safeDump(snippet, {
        indent: 4,
        lineWidth: -1,
        sortKeys: <any>((a, b) => snippetFieldSortingOrder[a] - snippetFieldSortingOrder[b]),
        skipInvalid: true
    });
}
