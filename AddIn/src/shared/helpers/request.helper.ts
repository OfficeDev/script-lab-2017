import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {Utilities, StorageHelper} from '../helpers';

export interface IToken {
    access_token: string;
    token_type: string;
    scope: string;
}

@Injectable()
export class RequestHelper {
    private _token: IToken;

    constructor(private _http: Http) { }

    get<T>(url: string, options?: RequestOptions, unformatted?: boolean) {
        let requestOptions = options || this._generateHeaders();
        let xhr = Utilities.isNull(requestOptions) ? this._http.get(url) : this._http.get(url, requestOptions);
        return unformatted ? xhr : this._json<T>(xhr);
    }

    post<T>(url: string, body: any, options?: RequestOptions, unformatted?: boolean) {
        let requestOptions =  options || this._generateHeaders();
        let xhr = Utilities.isNull(requestOptions) ? this._http.post(url, JSON.stringify(body)) : this._http.post(url, JSON.stringify(body), requestOptions);
        return unformatted ? xhr : this._json<T>(xhr);
    }

    put<T>(url: string, body: any, options?: RequestOptions, unformatted?: boolean) {
        let requestOptions = options || this._generateHeaders();
        let xhr = Utilities.isNull(requestOptions) ? this._http.put(url, JSON.stringify(body)) : this._http.put(url, JSON.stringify(body), requestOptions);
        return unformatted ? xhr : this._json<T>(xhr);
    }

    raw(url: string, options?: RequestOptions, unformatted?: boolean) {
        let xhr = Utilities.isNull(options) ? this._http.get(url) : this._http.get(url, options);
        return unformatted ? xhr : this._text(xhr);
    }

    token(value: IToken): IToken {
        if (Utilities.isNull(value)) {
            throw new Error('Token cannot be null!');
        }

        this._token = value;
        return this._token;
    }

    private _generateHeaders(): RequestOptions {
        if (Utilities.isNull(this._token)) {
            throw new Error('Token is null! Please authenticate first.');
        }

        var headers = new Headers({
            "Accept": "application/json",
            "Authorization": "Bearer " + this._token.access_token
        });

        return new RequestOptions({ headers: headers });
    }

    private _text(request: Observable<any>): Observable<string> {
        return request
            .map(response => response.text() as string)
            .catch((err: any, caught: Observable<string>) => Utilities.error<string>(err) as Observable<string>);
    }

    private _json<T>(request: Observable<any>): Observable<T> {
        return request
            .map(response => {
                return response.json() as T
            })
            .catch((err: any, caught: Observable<T>) => Utilities.error<T>(err) as Observable<T>);
    }
}