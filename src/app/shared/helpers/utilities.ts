import {Observable} from 'rxjs/Rx';

export enum ContextType {
    Web,
    Word
}

export class Utils {
    private static _context: ContextType;

    static component(view: string, overrides?: any, parent?: string) {
        var defaults = {
            selector: view,
            templateUrl: 'app/' + (parent || view) + '/' + view + '.component.html',
            styleUrls: ['app/' + (parent || view) + '/' + view + '.component.css']
        }

        return _.extend({}, defaults, overrides);
    }

    static replace(source: string): (key: string, value: string) => any {
        return function self(key: string, value: string): any {
            if (!key) return source;
            source = source.replace(key, value);
            return self;
        };
    }

    static regex(source: string): (key: RegExp, value: string) => any {
        return function self(key: RegExp, value: string): any {
            if (!key) return source;
            source = source.replace(key, value);
            return self;
        };
    }

    static isNull(obj: any): boolean {
        return _.isUndefined(obj) || _.isNull(obj);
    }

    static isEmpty(obj: any): boolean {
        return Utils.isNull(obj) || _.isEmpty(obj);
    }

    static get isWord() {
        return this._context == ContextType.Word;
    }

    static get isWeb() {
        return this._context == ContextType.Web;
    }

    static error<T>(exception?: any): Observable<T> | Promise<T> | OfficeExtension.IPromise<T> {
        console.log('Error: ' + JSON.stringify(exception));

        if (Utils.isWord) {
            if (exception instanceof OfficeExtension.Error) {
                console.log('Debug info: ' + JSON.stringify(exception.debugInfo));
            }
        }

        return exception;
    }

    static setContext() {
        if (_.has(window, 'Office') && _.has(window, 'Word')) {
            this._context = ContextType.Word;
        }
        else {
            this._context = ContextType.Web;
        };
    }
}

Utils.setContext();