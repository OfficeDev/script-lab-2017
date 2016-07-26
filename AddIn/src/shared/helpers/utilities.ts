export enum ContextType {
    Web,
    Word,
    Excel
}

export class Utilities {
    private static _context: ContextType = null;

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
        return this.isNull(obj) || _.isEmpty(obj);
    }

    static get isExcel() {
        return this._context == ContextType.Excel;
    }

    static get isWord() {
        return this._context == ContextType.Word;
    }

    static get isWeb() {
        return this._context == ContextType.Web;
    }

    static error<T>(exception?: any): any {
        console.log('Error: ' + JSON.stringify(exception));

        if (this.isWord) {
            if (exception instanceof OfficeExtension.Error) {
                console.log('Debug info: ' + JSON.stringify(exception.debugInfo));
            }
        }

        return exception;
    }

    static get context(): ContextType {
        if (this.isNull(this._context)) {
            if (_.has(window, 'Office')) {
                if (_.has(window, 'Word')) {
                    this._context = ContextType.Word;
                }
                else if (_.has(window, 'Excel')) {
                    this._context = ContextType.Excel;
                }
            }
            else {
                this._context = ContextType.Web;
            };
        }
        return this._context;
    }
}