import { ErrorHandler } from '@angular/core';
import { CustomError } from '@microsoft/office-js-helpers';
import { AI } from './ai.helper';

/**
 * A class for signifying that an error is a "handleable" error that comes from the playground,
 * as opposed to an error that comes from some internal operation or runtime error.
 */
export class PlaygroundError extends CustomError {
    constructor(message: string, error?: Error) {
        super('PlaygroundError', message, error);
        AI.trackException(this, this.stack);
    }
}

/** An Error-like object used to convey information with a title and message
 * (but no App-Insights exception-tracking, for example) */
export class InformationalError extends CustomError {
    constructor(public title: string, message: string) {
        super('InformationalError', message);
    }
}

export class ExceptionHandler implements ErrorHandler {
    handleError(exception: any) {
        AI.trackException(exception, 'Global Exception Service');
    }
}

export const EXCEPTION_PROVIDER = { provide: ErrorHandler, useClass: ExceptionHandler };
