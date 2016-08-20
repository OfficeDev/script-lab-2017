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
    static baseWebUrl: string = 'https://api-playground-web.azurewebsites.net/';
    static baseWebUrlSnippets: string = SnippetService.baseWebUrl + 'snippets/';
    private _baseApiUrlNoSlash: string = SnippetService.baseWebUrl + 'api';

    constructor(private _request: RequestHelper) {

    }

    get(id: string): Promise<Snippet> {
        var meta = this._request.get<ISnippetMeta>(`${this._baseApiUrlNoSlash}/snippets/${id}`) as Promise<ISnippetMeta>;

        return meta.then((metadata) => {
            if (Utilities.isEmpty(metadata)) {
                throw new Error(); // will be picked up below.
            }

            // if it's being imported, don't worry about what hosts can in, and just use the current one.
            metadata.hosts = Utilities.contextString;
            
            var script = this._request.get(`${this._baseApiUrlNoSlash}/snippets/${id}/content/script`, true);
            var html = this._request.get(`${this._baseApiUrlNoSlash}/snippets/${id}/content/html`, true);
            var css = this._request.get(`${this._baseApiUrlNoSlash}/snippets/${id}/content/css`, true);
            var libraries = this._request.get(`${this._baseApiUrlNoSlash}/snippets/${id}/content/libraries`, true);

            // FIXME
            var allPromises = Promise.all([
                script.catch(e => ""),
                html.catch(e => ""),
                css.catch(e => ""),
                libraries.catch(e => "")
            ]);

            return allPromises.then(results => 
                new Snippet({
                    meta: metadata,
                    script: results[0],
                    html: results[1],
                    css: results[2],
                    libraries: results[3]
                })
            ).catch(UxUtil.showErrorNotification);
        }).catch((e) => {
            console.log(e);
            throw new Error(MessageStrings.InvalidSnippetIdOrUrl)
        });
    }

    create(name: string, nonEmptyContentTypes: string[], password?: string): Promise<IToken> {
        var body = {
            name: name,
            password: password,
            hosts: Utilities.context,
            metadataVersion: 1.0,
            contains: nonEmptyContentTypes.join(',')
        };
        return this._request.post(this._baseApiUrlNoSlash + '/snippets', body);
    }

    upload(meta: ISnippetMeta, content: string, segment: string) {
        if (Utilities.isEmpty(content)) Promise.resolve("");
        var headers = RequestHelper.generateHeaders({
            "Content-Type": "application/octet-stream",
            "x-ms-b64-password": btoa(meta.key)
        });
        return this._request.put(this._baseApiUrlNoSlash + '/snippets/' + meta.id + '/content/' + segment, content, headers);
    }

}