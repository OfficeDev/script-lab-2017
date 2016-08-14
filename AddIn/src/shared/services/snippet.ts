import {Utilities, MessageStrings} from '../helpers';
import {SnippetManager} from './snippet.manager';

export class Snippet implements ISnippet {
    meta: {
        name: string;
        id: string;
        key?: string;
        group?: string;
        client?: OfficeClient[];
    };
    ts: string;
    html: string;
    css: string;
    extras: string;

    jsHash: string;

    private _compiledJs: string;

    constructor(snippet: ISnippet) {
        this.meta = _.extend({}, snippet.meta || {name: undefined, id: undefined});
        this.ts = snippet.ts || "";
        this.css = snippet.css || "";
        this.html = snippet.html || "";
        this.extras = snippet.extras || "";

        if (Utilities.isNullOrWhitespace(this.meta.id)) {
            this.randomizeId();
        }
    }

    // A bit of a hack (probably doesn't belong here, but want to get an easy "run" link)
    get runUrl(): string {
        var url = window.location.toString() + "#/run/" + this.meta.id;
        return url;
    }

    get js(): Promise<string> {
        if (Snippet._isValid(this.ts)) {
            this._compiledJs = this.ts;
            return Promise.resolve(this._compiledJs);
        }
        else {
            // FIXME expose to user
            return Promise.reject<string>("Invalid JavaScript (or is TypeScript, which we don't have a compiler for yet)");
            // return this._compile(this.ts).then((compiledJs) => {
            //     this._compiledJs = compiledJs;
            //     return compiledJs; 
            // })
        }
    }

    getJsLibaries(): Array<string> {
        return Utilities.stringOrEmpty(this.extras).split("\n")
            .map((entry) => {
                entry = entry.toLowerCase().trim();

                if (entry.length === 0 || entry.startsWith("//") || entry.startsWith("@types") || entry.endsWith(".css")) {
                    return null;
                }

                if (Snippet._entryIsUrl(entry) && entry.endsWith(".js")) {
                    return Snippet._normalizeUrl(entry);
                }

                // otherwise assume it's an NPM package name
                return "//npmcdn.com/" + entry;
            })
            .filter((entry) => entry != null);
    }

    getCssStylesheets(): Array<string> {
        return Utilities.stringOrEmpty(this.extras).split("\n")
            .map((entry) => entry.trim().toLowerCase())
            .filter((entry) => entry.endsWith(".css"))
            .map((entry) => {
                if (Snippet._entryIsUrl(entry)) {
                    return Snippet._normalizeUrl(entry);
                }

                // otherwise assume it's an NPM package name
                return "//npmcdn.com/" + entry;
            })
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
        var localSnippets = new SnippetManager(null).getLocal(); 
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
            Utilities.error(syntaxError);
            return false;
        }
    }

    private _compile(ts: string): Promise<string> {
        // FIXME
        return Promise.resolve(ts);
    }

    public computeHash(): string {
        var md5: (input: string) => string = require('js-md5');
        return md5([this.ts, this.html, this.css, this.extras].map(item => md5(item)).join(":"));
    }

    public makeNameUnique(isDuplicate: boolean): void {
        var localSnippets = new SnippetManager(null).getLocal(); 

        if (Utilities.isNullOrWhitespace(name)) {
            this.meta.name = MessageStrings.NewSnippetName;
        }

        if (isNameUnique(this)) {
            return;
        }

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
        var regexMatches = regex.exec(name);
        var prefix = this.meta.name;

        if (regexMatches === null) {
            if (isDuplicate) {
                this.meta.name = prefix + " - copy";
                if (isNameUnique(this)) {
                    return;
                }
            }
        } else {
            prefix = regexMatches[0];
        }
        
        var i = 1;
        while (true) {
            this.meta.name = `${prefix}${isDuplicate ? " - copy " : " "}${i}`;
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
    key?: string;
    group?: string;
    client?: OfficeClient[];
}

export interface ISnippet {
    meta?: ISnippetMeta;
    ts?: string;
    html?: string;
    css?: string;
    extras?: string;
}
