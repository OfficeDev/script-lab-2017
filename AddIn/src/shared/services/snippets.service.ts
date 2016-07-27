import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Utilities} from '../helpers';

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
        return null;
    }

    private _hash() {

    }

    static create(meta, js, html, css, extras): Promise<Snippet> {
        return Promise.all([meta, js, html, css, extras])
            .then(results => {
                return new Snippet(
                    results[0].json(),
                    results[1].text(),
                    results[2].text(),
                    results[3].text(),
                    results[4].text()
                );
            })
            .catch(error => Utilities.error);
    }
}

@Injectable()
export class SnippetsService {
    private _baseUrl: string = 'https://xlsnippets.azurewebsites.net/api';

    constructor(private _http: Http) {

    }

    get(snippetId: string): Promise<Snippet> {
        console.log(snippetId);
        var meta = this._http.get(this._baseUrl + '/snippets/' + snippetId).toPromise();
        var js = this._http.get(this._baseUrl + '/snippets/' + snippetId + '/content/js').toPromise();
        var html = this._http.get(this._baseUrl + '/snippets/' + snippetId + '/content/html').toPromise();
        var css = this._http.get(this._baseUrl + '/snippets/' + snippetId + '/content/css').toPromise();
        var extras = this._http.get(this._baseUrl + '/snippets/' + snippetId + '/content/extras').toPromise();
        return Snippet.create(meta, js, html, css, extras);
    }
}