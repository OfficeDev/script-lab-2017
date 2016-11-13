import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import * as _ from 'lodash';
import * as jsyaml from 'js-yaml';

export enum ResponseTypes {
    YAML,
    JSON,
    RAW,
    BLOB
}

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
        headersObj['Accept'] = 'application/json';

        let headers = new Headers(headersObj);
        return new RequestOptions({ headers: headers });
    }

    private _response(request: Observable<any>, responseType: ResponseTypes): Promise<any> {
        switch (responseType) {
            case ResponseTypes.YAML: return this._yaml(request);

            case ResponseTypes.JSON: return this._json(request);

            case ResponseTypes.BLOB: return this._blob(request);

            case ResponseTypes.RAW:
            default: return this._text(request);
        }
    }

    private _text(request: Observable<any>): Promise<string> {
        return request
            .map(response => response.text() as string)
            .toPromise()
            .catch(this._errorHandler);
    }

    private _blob<T>(request: Observable<any>): Promise<Blob> {
        return request
            .map(response => response.blob())
            .toPromise()
            .catch(this._errorHandler);
    }

    private _json<T>(request: Observable<any>): Promise<T> {
        return request
            .map(response => response.json() as T)
            .toPromise()
            .catch(this._errorHandler);
    }

    private _yaml<T>(request: Observable<any>): Promise<T> {
        return this._text(request)
            .then(yaml => jsyaml.safeLoad(yaml));
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
