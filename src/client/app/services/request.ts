import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
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

    local<T>(path, responseType: ResponseTypes): Observable<T> {
        let xhr = this._http.get(`assets/${path}`);
        return this._response(xhr, responseType);
    }

    get<T>(url: string, responseType: ResponseTypes, headers?: Object, forceBypassCache?: boolean): Observable<T> {
        if (forceBypassCache != null && forceBypassCache) {
            url = url + ((url.indexOf('?') === -1) ? '?' : '&') + `timestamp=${(new Date).getTime()}`;
        }

        let options = this._generateHeaders(headers);
        let xhr = this._http.get(url, options);
        return this._response(xhr, responseType);
    }

    post<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.post(url, body, options);
        return this._response(xhr, responseType);
    }

    put<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object): Observable<T> {
        let options = this._generateHeaders(headers);
        let xhr = this._http.put(url, body, options);
        return this._response(xhr, responseType);
    }

    patch<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object): Observable<T> {
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
        let headersObj = { ...additionalHeaders };
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
