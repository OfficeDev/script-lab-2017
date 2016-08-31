import {Utilities, GistUtilities, IGistResponse, MessageStrings, UxUtil, PlaygroundError} from '../helpers';
import {SnippetManager} from './snippet.manager';
import * as ts from '../../../node_modules/typescript';

export class Snippet implements ISnippet {
    meta: ISnippetMeta;
    script: string;
    html: string;
    css: string;
    libraries: string;

    lastSavedHash: string;
    private _compiledJs: string;

    constructor(snippet: ISnippet) {
        this.meta = _.extend({}, snippet.meta || {name: undefined, id: undefined});
        this.script = snippet.script || "";
        this.css = snippet.css || "";
        this.html = snippet.html || "";
        this.libraries = snippet.libraries || "";

        this.lastSavedHash = this.getHash();
    }

    toJSON(): any {
       return this.exportToJson(false /*forPlayground*/);
    }

    exportToJson(forPlayground: boolean) : any {
        var data = {
            meta: {
                name: this.meta.name
            }
        };

        if (forPlayground) {
            data.meta['playgroundVersion'] = 1.0;
        } else {
            data.meta['id'] = this.meta.id;
        }

        var contentTypes = ["script", "css", "html", "libraries"];
        contentTypes.forEach((type) => {
            if (!Utilities.isNullOrWhitespace(this[type])) {
                data[type] = (<string>this[type]).replace(/\r?\n|\r/g, '\n');

                // for playground, break into array for ease of readability:
                if (forPlayground) {
                    data[type] = data[type].split("\n");
                }
            }
        });

        return data;
    }

    // A bit of a hack (probably doesn't belong here, but want to get an easy "run" link)
    get runUrl(): string {
        var url = window.location.toString() + "#/run/" + this.meta.id;
        return url;
    }

    getCompiledJs(): string {
        // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
        let result = ts.transpileModule(this.script, {            
            compilerOptions: { module: ts.ModuleKind.CommonJS },
            reportDiagnostics: true,
        });

        if (result.diagnostics.length === 0) {
            // It looks like TypeScript puts a "use strict" at the top.
            // However, we put out own in the runner, in a different location,
            // so strip it out of this output.
            var outputArray = Utilities.stringOrEmpty(result.outputText).split('\n');
            var firstLine = outputArray[0].trim();
            if (firstLine === '"use strict";' || firstLine === "'use strict';") {
                outputArray.splice(0, 1);
            } 
            return outputArray.join('\n');
        } else {
            var errorWordSingularOrPlural = result.diagnostics.length > 1 ? "errors" : "error";
            var errors: string[] = [
                'Invalid JavaScript or TypeScript. ' + 
                `Please return to the editor and fix the following syntax ${errorWordSingularOrPlural}:`
            ];
            result.diagnostics.map((diag) => {
                var position = diag.file.getLineAndCharacterOfPosition(diag.start);
                var sourceText = diag.file.text.substr(diag.start, diag.length);
                errors.push(`* Line ${position.line + 1 /*0-indexed*/}, char ${position.character}: ${diag.messageText}` + 
                    '\n-->    Source code: ' + sourceText);
            });

            console.log(Utilities.stringifyPlusPlus(errors));
            throw new PlaygroundError(errors);
        }
    }

    getJsLibaries(): Array<string> {
        return Utilities.stringOrEmpty(this.libraries).split("\n")
            .map((entry) => {
                entry = entry.trim();

                var lowercaseEntry = entry.toLowerCase();

                if (lowercaseEntry.length === 0 || lowercaseEntry.startsWith("#") || lowercaseEntry.startsWith("@types") ||
                    lowercaseEntry.endsWith(".css") || lowercaseEntry.endsWith(".ts")
                ) {
                    return null;
                }

                if (Utilities.isUrl(entry) && lowercaseEntry.endsWith(".js")) {
                    return Utilities.normalizeUrl(entry);
                }

                // otherwise assume it's an NPM package name
                return "//npmcdn.com/" + entry;
            })
            .filter((entry) => entry != null);
    }

    get containsOfficeJsReference(): boolean {
        return this.getJsLibaries()
            .filter(item => {
                var lowercase = item.toLowerCase();
                return lowercase.endsWith("/office.js") || lowercase.endsWith("/office.debug.js");
            }).length > 0;
    }

    getOfficeJsReference(): string {
        var matchedValues = this.getJsLibaries()
            .filter(item => {
                var lowercase = item.toLowerCase();
                return lowercase.endsWith("/office.js") || lowercase.endsWith("/office.debug.js");
            });
        switch (matchedValues.length) {
            case 0:
                throw new PlaygroundError('Script contains no Office.js references');
            case 1:
                return matchedValues[0];
            default:
                throw new PlaygroundError('Script contains more than one Office.js reference, but there should only be one such reference.');
        }
    }

    getCssStylesheets(): Array<string> {
        return Utilities.stringOrEmpty(this.libraries).split("\n")
            .map((entry) => entry.trim().toLowerCase())
            .filter((entry) => !entry.startsWith("#") && entry.endsWith(".css"))
            .map((entry) => {
                if (Utilities.isUrl(entry)) {
                    return Utilities.normalizeUrl(entry);
                }

                // otherwise assume it's an NPM package name
                return "//npmcdn.com/" + entry;
            })
    }

    /**
     * Returns TypeScript definitions in sorted order
     */
    getTypeScriptDefinitions(): Array<string> {
        return Utilities.stringOrEmpty(this.libraries).split("\n")
            .map((entry) => entry.trim().toLowerCase())
            .filter((entry) => !entry.startsWith("#") && (entry.startsWith("@types") || entry.endsWith(".ts")))
            .map((entry) => {
                if (entry.startsWith("@types")) {
                    return "//npmcdn.com/" + entry + "/index.d.ts";
                }

                return Utilities.normalizeUrl(entry);
            })
            .sort();
    }

    randomizeId(force: boolean, snippetManager: SnippetManager) {
        var localSnippets = snippetManager.getLocal(); 
        if (force || Utilities.isEmpty(this.meta.id) || this.meta.id.indexOf('~!L') == -1) {
            this.meta.id = '~!L' + Utilities.randomize(Math.max(10000, localSnippets.length * 10)).toString();
        }

        // Ensure it is, in fact, unique
        if (localSnippets.find(item => (item.meta.id === this.meta.id))) {
            this.randomizeId(true /*force*/, snippetManager);
        }
    }

    public getHash(): string {
        var md5: (input: string) => string = require('js-md5');
        return md5(JSON.stringify(this));
    }

    public makeNameUnique(isDuplicate: boolean, snippetManager: SnippetManager): void {
        var localSnippets = snippetManager.getLocal(); 

        if (Utilities.isNullOrWhitespace(this.meta.name)) {
            this.meta.name = MessageStrings.NewSnippetName;
        }

        if (isNameUnique(this)) {
            return;
        }

        var prefix = Utilities.stringOrEmpty(this.meta.name);
        if (isDuplicate) {
            // If name doesn't have "copy" in it, try to use "<name> - copy".
            // Otherwise (or if the copy one is already taken), find the first available "<name> - copy <number>".
            var regex = /(.*) - copy( \d+)?$/i;
            /*  Will match these:
                    test - copy
                    test - copy 1
                    test - copy 2
                    test - copy 222
                But not these:
                    test
                    test - copy 222 gaga
            */
            var regexMatches = regex.exec(this.meta.name);
            
            if (regexMatches) {
                prefix = regexMatches[1];
            }

            prefix = prefix + ' - copy';

        } else {
            // Does it end with just a number on the end?  If so, grab that?
            var regex = /(.*) \d+$/;
            /* Will match these:
                    test 1
                    test 122
                But not these:
                    test
                    test - copy
                    test - copy 222 gaga
            */

            var regexMatches = regex.exec(this.meta.name);
            
            if (regexMatches) {
                prefix = regexMatches[1];
            }
        }
        
        var i = 1;
        while (true) {
            this.meta.name = prefix + ' ' + i;
            if (isNameUnique(this)) {
                return;               
            }
            i++;
        }

        function isNameUnique(snippet: Snippet) {
            return Utilities.isNull(localSnippets.find((item) => 
                (item.meta.id != snippet.meta.id && item.meta.name == snippet.meta.name)));
        }
    }

    static createFromJson(inputValue: string): Snippet {
        var json: ISnippet = JSON.parse(inputValue);
        
        if (Utilities.isEmpty(json.meta)) {
            throw new PlaygroundError('Missing "meta" field in snippet JSON.');
        }
        if (_.isUndefined(json.meta.playgroundVersion)) {
            throw new PlaygroundError('Missing "meta.playgroundVersion" field in the snippet JSON.');
        }

        switch (json.meta.playgroundVersion) {
            case 1:
                return createSnippetFromPlaygroundVersion1_0();
            default:
                throw new PlaygroundError('Invalid playgroundVersion version "' + 
                    json.meta.playgroundVersion + '" specified in the JSON metadata.');
        }

        function createSnippetFromPlaygroundVersion1_0() {
            return new Snippet({
                meta: {
                    name: json.meta.name
                },
                script: fromJsonInput("script", json),
                html: fromJsonInput("html", json),
                css: fromJsonInput("css", json),
                libraries: fromJsonInput("libraries", json)
            });
        }

        function fromJsonInput(fieldName: string, json: Object) {
            var input: string | string[] = json[fieldName];

            if (_.isString(input)) {
                return input;
            } else if (_.isArray(input)) {
                return input.join('\n');
            } else if (Utilities.isNullOrWhitespace(<any>input)) {
                return undefined;
            } else {
                throw new PlaygroundError(`Could not parse the ${fieldName} field of the JSON body of the snippet.`);
            }
        }
    }

    /** snippet id:  either the id of the snippet, or "id/revision". But both can be fed "as is" to the GitHub API */
    static createFromGist(snippetId: string): Promise<Snippet> {
        var apiUrl = 'https://api.github.com/gists/' + snippetId;
        return new Promise((resolve, reject) => {
            $.getJSON(apiUrl)
                .then(
                    (gist: IGistResponse) => {
                        return GistUtilities.getMetadata(gist)
                            .then((metaJson) => 
                                resolve(GistUtilities.processPlaygroundSnippet(metaJson, gist)))
                            .catch(UxUtil.catchError("Import error",
                                'An unexpected error occurred while importing the snippet.'));
                    },
                    (e) => {
                        reject("Could not fetch the snippet. Are you sure that the GitHub Gist URL is correct?\n" + 
                            "Also, please ensure that the URL does *not* include the username, only the Gist ID.");
                    });
        });
    }
}

export enum OfficeClient {
    Word,
    Excel,
    PowerPoint,
    Project,
    OneNote
}

export interface ISnippetMeta {
    name: string;

    /** ID: present on local snippets but not on exported JSON */
    id?: string;

    /** playgroundVersion: present on exported JSON but not on local snippet */
    playgroundVersion?: number;
}

export interface ISnippet {
    meta?: ISnippetMeta;
    script?: string;
    html?: string;
    css?: string;
    libraries?: string;
}
