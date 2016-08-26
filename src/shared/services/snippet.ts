import {Utilities, MessageStrings, UxUtil} from '../helpers';
import {SnippetManager} from './snippet.manager';

export class Snippet implements ISnippet {
    meta: ISnippetMeta;
    script: string;
    html: string;
    css: string;
    libraries: string;

    jsHash: string;

    lastSavedHash: string;
    private _compiledJs: string;

    constructor(snippet: ISnippet, private _snippetManager: SnippetManager) {
        this.meta = _.extend({}, snippet.meta || {name: undefined, id: undefined});
        this.script = snippet.script || "";
        this.css = snippet.css || "";
        this.html = snippet.html || "";
        this.libraries = snippet.libraries || "";

        if (Utilities.isNullOrWhitespace(this.meta.id)) {
            this.randomizeId();
        }

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

    get js(): Promise<string> {
        if (Snippet._isValid(this.script)) {
            this._compiledJs = this.script;
            return Promise.resolve(this._compiledJs);
        }
        else {
            return Promise.reject<string>(new Error("Invalid JavaScript (or is TypeScript, which we don't have a compiler for yet)"));
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

                if (Snippet._entryIsUrl(entry) && lowercaseEntry.endsWith(".js")) {
                    return Snippet._normalizeUrl(entry);
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

    getCssStylesheets(): Array<string> {
        return Utilities.stringOrEmpty(this.libraries).split("\n")
            .map((entry) => entry.trim().toLowerCase())
            .filter((entry) => !entry.startsWith("#") && entry.endsWith(".css"))
            .map((entry) => {
                if (Snippet._entryIsUrl(entry)) {
                    return Snippet._normalizeUrl(entry);
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

                return Snippet._normalizeUrl(entry);
            })
            .sort();
    }

    static _entryIsUrl(entry: string): boolean {
        entry = entry.trim().toLowerCase();
        return entry.startsWith("http://") || entry.startsWith("https://") || entry.startsWith("//");
    }

    static _normalizeUrl(url: string): string {
        // strip out https: or http:
        return url.substr(url.indexOf("//"));
    }

    randomizeId(force?: boolean) {
        var localSnippets = this._snippetManager.getLocal(); 
        if (force || Utilities.isEmpty(this.meta.id) || this.meta.id.indexOf('~!L') == -1) {
            this.meta.id = '~!L' + Utilities.randomize(Math.max(10000, localSnippets.length * 10)).toString();
        }

        // Ensure it is, in fact, unique
        if (localSnippets.find(item => (item.meta.id === this.meta.id))) {
            this.randomizeId(true /*force*/);
        }
    }

    static _isValid(scriptText): boolean {
        try {
            new Function(scriptText);
            return true;
        } catch (syntaxError) {
            UxUtil.showErrorNotification("Invalid snippet code.", syntaxError);
            return false;
        }
    }

    public getHash(): string {
        var md5: (input: string) => string = require('js-md5');
        return md5(JSON.stringify(this));
    }

    public makeNameUnique(isDuplicate: boolean): void {
        var localSnippets = this._snippetManager.getLocal(); 

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
    id: string;
}

export interface ISnippet {
    meta?: ISnippetMeta;
    script?: string;
    html?: string;
    css?: string;
    libraries?: string;
}
