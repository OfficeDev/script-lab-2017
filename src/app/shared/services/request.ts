import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
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
    headers: Object;

    constructor(private _http: Http) { }

    url(url: string, params: Object) {
        _.forEach(params, (value, key) => {
            url = url.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return url;
    }

    local<T>(path, responseType: ResponseTypes) {
        let xhr = this._http.get(`assets/${path}`);
        return this._response(xhr, responseType) as Promise<T>;
    }

    get<T>(url: string, responseType: ResponseTypes, headers?: Object) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.get(url, options);
        return this._response(xhr, responseType) as Promise<T>;
    }

    post<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.post(url, body, options);
        return this._response(xhr, responseType) as Promise<T>;
    }

    put<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.put(url, body, options);
        return this._response(xhr, responseType) as Promise<T>;
    }

    patch<T>(url: string, body: any, responseType: ResponseTypes, headers?: Object, raw?: boolean) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.patch(url, body, options);
        return this._response(xhr, responseType) as Promise<T>;
    }

    delete<T>(url: string, responseType: ResponseTypes, headers?: Object) {
        let options = this._generateHeaders(headers);
        let xhr = this._http.delete(url, options);
        return this._response(xhr, responseType) as Promise<T>;
    }

    private _generateHeaders(additionalHeaders: Object): RequestOptions {
        let headersObj = _.extend({}, this.headers, additionalHeaders);
        let headers = new Headers(headersObj);
        return new RequestOptions({ headers: headers });
    }

    private _response(xhr: Observable<Response>, responseType: ResponseTypes): Promise<any> {
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
        }).toPromise();
    }
}
