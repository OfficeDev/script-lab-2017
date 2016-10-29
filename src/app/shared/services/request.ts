import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import * as _ from 'lodash';

@Injectable()
export class Request {
    headers: Object;

    constructor(private _http: Http) {
    }

    url(url: string, params: Object) {
        _.forEach(params, (value, key) => {
            url = url.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return url;
    }

    local(path): Promise<string> {
        var xhr = this._http.get(`assets/${path}`);
        return this._text(xhr);
    }

    get<T>(url: string, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.get(url, options);
        return raw ? this._text(xhr) : this._json<T>(xhr);
    }

    post<T>(url: string, body: any, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.post(url, body, options);
        return raw ? this._text(xhr) : this._json<T>(xhr);
    }

    put<T>(url: string, body: any, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.put(url, body, options);
        return raw ? this._text(xhr) : this._json<T>(xhr);
    }

    patch<T>(url: string, body: any, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.patch(url, body, options);
        return raw ? this._text(xhr) : this._json<T>(xhr);
    }

    delete<T>(url: string, headers?: Object) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.delete(url, options);
        return this._boolean(xhr);
    }

    private _generateHeaders(additionalHeaders: Object): RequestOptions {
        var headersObj = _.extend({}, headers, additionalHeaders);
        headersObj["Accept"] = "application/json";

        var headers = new Headers(headersObj);
        return new RequestOptions({ headers: headers });
    }

    private _text(request: Observable<any>): Promise<string> {
        return request
            .map(response => response.text() as string)
            .toPromise()
            .catch(this._errorHandler);
    }

    private _json<T>(request: Observable<any>): Promise<T> {
        return request
            .map(response => response.json() as T)
            .toPromise()
            .catch(this._errorHandler);
    }

    private _boolean(request: Observable<any>): Promise<boolean> {
        return request
            .map(response => response.text() as string)
            .toPromise()
            .then(result => true)
            .catch(error => false);
    }

    private _errorHandler(error) {
        // TODO: handle errors
        throw error;
    }
}