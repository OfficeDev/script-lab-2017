import {Utilities} from '../helpers';

export enum ContextType {
    Unknown,
    Excel,
    Word,
    PowerPoint,
    OneNote
}

export class ContextUtil {
    static officeJsUrl = '//appsforoffice.microsoft.com/lib/1/hosted/office.js';

    static officeHelpersManualDTS = Utilities.stripSpaces(`
        declare module OfficeHelpers {
            /**
             * Logs the error, as well and its "debugInfo" (if it's an OfficeExtension.Error object).
             * Will log to console by default, but can be redirected by providing a customLogger function)
             */
            function logError(error: Error, customLogger?: (data: any) => void): void;
        }`);

    static officeHelpersManualJs = Utilities.stripSpaces(`
        var OfficeHelpers;
        (function (OfficeHelpers) {
            function logError(error, customLogger) {
                var logFunction = customLogger || console.log;
                logFunction(error);
                if (error instanceof OfficeExtension.Error) {
                    logFunction("Debug info: " + JSON.stringify(error.debugInfo));
                }
            }
            OfficeHelpers.logError = logError;
        })(OfficeHelpers || (OfficeHelpers = {}));
    `);

    /** Indicates whether the getScript for Office.js has been initiated already */
    static windowkey_initiatedOfficeLoading = 'initiatedOfficeLoading';

    /** Returns true after Office.initialized has been called */
    static windowkey_officeInitialized = 'officeInitialized';

    static sessionStorageKey_context = 'context'
    static sessionStorageKey_wasLaunchedFromAddin = 'wasLaunchedFromAddin';


    static getGlobalState(sessionStorageKey: string) {
        return window[sessionStorageKey];
    }

    static setGlobalState(sessionStorageKey: string, value: any) {
        return window[sessionStorageKey] = value;
    }

    static get contextString(): string {
        return window.sessionStorage.getItem(ContextUtil.sessionStorageKey_context);
    }

    static get isAddin(): boolean {
        // Note: it's an intentional string comparison.
        return window.sessionStorage.getItem(ContextUtil.sessionStorageKey_wasLaunchedFromAddin) === 'true';
    }

    /** 
     * Gets the context type or "unknown".  Note, this function does NOT throw on unknown,
     * though many of the derived ones (hostName, contextNamespace, etc.) do.
     */
    static get context(): ContextType {
        switch (ContextUtil.contextString) {
            case 'excel':
                return ContextType.Excel;
            case 'word':
                return ContextType.Word;
            case 'powerpoint':
                return ContextType.PowerPoint;
            case 'onenote':
                return ContextType.OneNote;
            default:
                return ContextType.Unknown;
        }
    }

    static setContext(context: string): void {
        window.sessionStorage.setItem(ContextUtil.sessionStorageKey_context, context);
    }

    static get isOfficeContext(): boolean {
        switch (ContextUtil.context) {
            case ContextType.Excel:
            case ContextType.Word:
            case ContextType.PowerPoint:
            case ContextType.OneNote:
                return true;

            default:
                return false;
        }
    }

    static get hostName() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return 'Excel';
            case ContextType.Word:
                return 'Word';
            case ContextType.PowerPoint:
                return 'PowerPoint'
            case ContextType.OneNote:
                return 'OneNote';
            default:
                throw new Error("Invalid context type for Office namespace");
        }
    }

    static get contextNamespace() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return 'Excel';
            case ContextType.Word:
                return 'Word';
            case ContextType.PowerPoint:
                return null; // Intentionally missing until PowerPoint has the new host-specific API model
            case ContextType.OneNote:
                return 'OneNote';
            default:
                throw new Error("Invalid context type for Office namespace");
        }
    }

    static get themeColor() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return '#217346';
            case ContextType.Word:
                return '#2b579a';
            case ContextType.PowerPoint:
                return '#d04526'
            case ContextType.OneNote:
                return '#80397b';
            default:
                return '#0478d7';
        }
    }

    static get themeColorDarker() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return '#164b2e';
            case ContextType.Word:
                return '#204072';
            case ContextType.PowerPoint:
                return '#a5371e'
            case ContextType.OneNote:
                return '#5d2959';
            default:
                return '#0360AF';
        }
    }

    static applyTheme() {        
        $('body').removeClass('excel');
        $('body').removeClass('word');
        $('body').removeClass('powerpoint');
        $('body').removeClass('onenote');
        $('body').removeClass('generic');

        switch (ContextUtil.context) {
            case ContextType.Excel: $('body').addClass('excel'); break;
            case ContextType.Word: $('body').addClass('word'); break;
            case ContextType.PowerPoint: $('body').addClass('powerpoint'); break;
            case ContextType.OneNote: $('body').addClass('onenote'); break;

            default: $('body').addClass('generic'); break;
        }
    }
}