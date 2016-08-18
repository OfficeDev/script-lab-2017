import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Utilities, UxUtil, RequestHelper, MessageStrings} from '../helpers';
import {ISnippet, ISnippetMeta, Snippet} from '../services';

export interface IToken {
    id: string,
    password: string
}

@Injectable()
export class SnippetService {
    private _baseUrl: string = 'https://api-playground-web.azurewebsites.net/api';

    constructor(private _request: RequestHelper) {

    }

    get(id: string): Promise<Snippet> {
        var meta = this._request.get<ISnippetMeta>(`${this._baseUrl}/snippets/${id}`) as Promise<ISnippetMeta>;

        return meta.then((metadata) => {
            if (Utilities.isEmpty(metadata)) {
                throw new Error(); // will be picked up below.
            }
            
            var script = this._request.get(`${this._baseUrl}/snippets/${id}/content/script`, true);
            var html = this._request.get(`${this._baseUrl}/snippets/${id}/content/html`, true);
            var css = this._request.get(`${this._baseUrl}/snippets/${id}/content/css`, true);
            var extras = this._request.get(`${this._baseUrl}/snippets/${id}/content/extras`, true);

            var allPromises = Promise.all([
                script.catch(e => ""),
                html.catch(e => ""),
                css.catch(e => ""),
                extras.catch(e => "")
            ]);

            return allPromises.then(results => 
                new Snippet(<ISnippet>{
                    meta: metadata,
                    ts: results[0],
                    html: results[1],
                    css: results[2],
                    extras: results[3]
                })
            ).catch(UxUtil.showErrorNotification);
        }).catch((e) => {
            console.log(e);
            throw new Error(MessageStrings.InvalidSnippetIdOrUrl)
        });
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

}