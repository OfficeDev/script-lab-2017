import {Utilities} from '../helpers';

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
    ts: string;
    html: string;
    css: string;
    extras: string;

    hash: string;
    jsHash: string;
}

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

    constructor(private snippet: ISnippet) {
        this.randomizeId();
    }

    randomizeId() {
        if (Utilities.isNull(this.snippet.meta)) {
            this.snippet.meta = {} as any;
        }
        this.snippet.meta.id = 'L' + Utilities.randomize(10000).toString();        
    }

    // A bit of a hack (probably doesn't belong here, but want to get an easy "run" link)
    get runUrl(): string {
        var url = window.location.toString() + "#/run/" + this.snippet.meta.id;
        return url;
    }

    get js(): Promise<string> {
        if (Snippet._isPureValidJs(this.snippet.ts)) {
            this._compiledJs = this.snippet.ts;
            return Promise.resolve(this._compiledJs);
        }
        else {
            // FIXME expose to user
            throw Utilities.error("Invalid JavaScript (or is TypeScript, which we don't have a compiler for yet)")
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

    static _isPureValidJs(scriptText): boolean {
        try {
            new Function(scriptText);
            return true;
        } catch (syntaxError) {
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

    static create(meta, js, html, css, extras): Promise<Snippet> {
        return Promise.all([meta, js, html, css, extras])
            .then(results => new Snippet(<ISnippet>{
                meta: results[0],
                ts: results[1],
                html: results[2],
                css: results[3],
                extras: results[4]
            }))
            .catch(error => Utilities.error);
    }
}