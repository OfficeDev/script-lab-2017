import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { PlaygroundError } from '../helpers';
import * as _ from 'lodash';
import * as jsyaml from 'js-yaml';

export enum ResponseTypes {
    YAML,
    JSON,
    TEXT,
    BLOB
}

@Injectable()
export class Request {
    constructor(private _http: Http) { }

    url(url: string, params: Object) {
        _.forEach(params, (value, key) => {
            url = url.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return url;
    }

    local<T>(path, responseType: ResponseTypes): Observable<T> {
        let xhr = this._http.get(`assets/${path}`);
        return this._response(xhr, responseType);
    }

    get<T>(url: string, responseType: ResponseTypes, headers?: Object): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.get(url, options);
        return this._response(xhr, responseType);
    }

    post<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.post(url, body, options);
        return this._response(xhr, responseType);
    }

    put<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.put(url, body, options);
        return this._response(xhr, responseType);
    }

    patch<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.patch(url, body, options);
        return this._response(xhr, responseType);
    }

    delete<T>(url: string, responseType: ResponseTypes, headers?: Object): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.delete(url, options);
        return this._response(xhr, responseType);
    }

    private _generateHeaders(additionalHeaders: Object): RequestOptions {
        let headersObj = _.extend({}, additionalHeaders);
        let headers = new Headers(headersObj);
        return new RequestOptions({ headers });
    }

    private _response(xhr: Observable<Response>, responseType: ResponseTypes): Observable<any> {
        return xhr.map(res => {
            switch (responseType) {
                case ResponseTypes.YAML:
                    return jsyaml.safeLoad(res.text());

                case ResponseTypes.JSON:
                    return res.json();

                case ResponseTypes.BLOB:
                    return res.blob();

                case ResponseTypes.TEXT:
                default:
                    return res.text();
            }
        });
    }
}
