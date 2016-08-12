import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Utilities, RequestHelper} from '../helpers';
import {ISnippet, ISnippetMeta, Snippet} from '../services';

export interface IToken {
    id: string,
    password: string
}

@Injectable()
export class SnippetService {
    private _baseUrl: string = 'https://xlsnippets.azurewebsites.net/api';

    constructor(private _request: RequestHelper) {

    }

    get(id: string): Promise<Snippet> {
        var meta = this._request.get<ISnippetMeta>(`${this._baseUrl}/snippets/${id}`) as Promise<ISnippetMeta>;
        var js = this._request.get(`${this._baseUrl}/snippets/${id}/content/js`, true);
        var html = this._request.get(`${this._baseUrl}/snippets/${id}/content/html`, true);
        var css = this._request.get(`${this._baseUrl}/snippets/${id}/content/css`, true);
        var extras = this._request.get(`${this._baseUrl}/snippets/${id}/content/extras`, true);
        return this._createSnippet(meta, js, html, css, extras);
    }

    create(name: string, password?: string): Promise<IToken> {
        var body = { name: name, password: password };
        return this._request.post(this._baseUrl + '/snippets', body);
    }

    upload(meta: ISnippetMeta, content: string, segment: string) {
        if (Utilities.isEmpty(content)) Promise.resolve("");
        var headers = RequestHelper.generateHeaders({
            "Content-Type": "application/octet-stream",
            "x-ms-b64-password": btoa(meta.key)
        });
        return this._request.put(this._baseUrl + '/snippets/' + meta.id + '/content/' + segment, content, headers);
    }

    _createSnippet(meta: Promise<ISnippetMeta>, ts: Promise<string>, html: Promise<string>, css: Promise<string>, extras: Promise<string>): Promise<Snippet> {
        return Promise.all([
            meta,
            ts.catch(e => ""),
            html.catch(e => ""),
            css.catch(e => ""),
            extras.catch(e => "")
        ])
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