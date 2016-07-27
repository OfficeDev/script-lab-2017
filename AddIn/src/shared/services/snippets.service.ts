import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Utilities, RequestHelper} from '../helpers';

export class Snippet {
    meta: {
        name: string,
        id: string
    };
    ts: string;
    html: string;
    css: string;
    extras: string;

    hash: string;
    jsHash: string;

    private _js: Promise<string>;

    constructor(meta, ts, html, css, extras) {
        this.meta = meta;
        this.ts = ts;
        this.css = css;
        this.extras = extras;
        this.html = html;
    }

    get js(): Promise<string> {
        if (this._mustCompile) {
            this._js = this._compile(this.ts);
        }

        return this._js;
    }

    private get _mustCompile(): boolean {
        return true;
    }

    private _compile(ts: string): Promise<string> {
        return Promise.resolve(ts);
    }

    private _hash() {

    }

    static create(meta, js, html, css, extras): Promise<Snippet> {
        return Promise.all([meta, js, html, css, extras])
            .then(results => new Snippet(results[0], results[1], results[2], results[3], results[4]))
            .catch(error => Utilities.error);
    }
}

@Injectable()
export class SnippetsService {
    private _baseUrl: string = 'https://xlsnippets.azurewebsites.net/api';

    constructor(private _request: RequestHelper) {

    }

    get(snippetId: string): Promise<Snippet> {
        console.log(snippetId);
        var meta = this._request.get(this._baseUrl + '/snippets/' + snippetId);
        var js = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/js', null, true);
        var html = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/html', null, true);
        var css = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/css', null, true);
        var extras = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/extras', null, true);
        return Snippet.create(meta, js, html, css, extras);
    }
}