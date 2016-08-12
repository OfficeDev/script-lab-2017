import {Utilities} from '../helpers';

export class Snippet implements ISnippet {
    meta: {
        name: string;
        id: string;
        key?: string;
        group?: string;
        client?: OfficeClient;
    };
    ts: string;
    html: string;
    css: string;
    extras: string;

    hash: string;
    jsHash: string;

    private _compiledJs: string;

    constructor(snippet: ISnippet) {
        this.meta = snippet.meta || {} as any;
        this.randomizeId();

        if (Utilities.isNull(this.meta)) throw 'Snippet metadata cannot be empty.';
        this._default(snippet);
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
        // FIXME
        return [
            "https://appsforoffice.microsoft.com/lib/1/hosted/office.js",
            "https://npmcdn.com/jquery",
            "https://npmcdn.com/office-ui-fabric/dist/js/jquery.fabric.min.js",
        ];
    }

    getCssStylesheets(): Array<string> {
        // FIXME
        return [
            "https://npmcdn.com/office-ui-fabric/dist/css/fabric.min.css",
            "https://npmcdn.com/office-ui-fabric/dist/css/fabric.components.min.css",
        ];
    }

    randomizeId(force?: boolean) {
        if (force || Utilities.isEmpty(this.meta.id) || this.meta.id.indexOf('~!L') == -1)
            this.meta.id = '~!L' + Utilities.randomize(10000).toString();
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

    private _hash() {
        // FIXME
    }

    // TODO: this is where we'll have our default code for each format.
    private _default(snippet: ISnippet) {
        this.ts = snippet.ts || "";
        this.css = snippet.css || "";
        this.html = snippet.html || "";
        this.extras = snippet.extras || "";
    }
}

export enum OfficeClient {
    All,
    Word,
    Excel,
    PowerPoint,
    Project,
    Outlook,
    OneNote
}

export interface ISnippetMeta {
    name: string;
    id: string;
    key?: string;
    group?: string;
    client?: OfficeClient;
}

export interface ISnippet {
    meta: ISnippetMeta;
    ts?: string;
    html?: string;
    css?: string;
    extras?: string;
    hash?: string;
    jsHash?: string;
}

