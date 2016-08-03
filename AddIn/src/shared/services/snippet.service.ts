import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Utilities, RequestHelper} from '../helpers';
import {ISnippet, Snippet} from '../services';

export interface IToken {
    id: string,
    password: string
}

@Injectable()
export class SnippetService {
    private _baseUrl: string = 'https://xlsnippets.azurewebsites.net/api';

    constructor(private _request: RequestHelper) {

    }

    get(snippetId: string): Promise<Snippet> {
        var meta = this._request.get(this._baseUrl + '/snippets/' + snippetId);
        var js = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/js', null, true);
        var html = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/html', null, true);
        var css = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/css', null, true);
        var extras = this._request.get(this._baseUrl + '/snippets/' + snippetId + '/content/extras', null, true);
        return Snippet.create(meta, js, html, css, extras);
    }

    create(name: string, password?: string): Promise<IToken> {
        var body = { name: name, password: password };
        return this._request.post(this._baseUrl + '/snippets', body);
    }

    uploadContent(snippet: ISnippet, segment: string) {
        var headers = RequestHelper.generateHeaders({
            "Content-Type": "application/octet-stream",
            "x-ms-b64-password": btoa(snippet.meta.key)
        });
        return this._request.put(this._baseUrl + '/snippets/' + snippet.meta.id + '/content/' + segment, snippet[segment], headers);
    }
}