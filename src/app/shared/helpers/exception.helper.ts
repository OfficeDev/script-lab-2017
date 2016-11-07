import { ErrorHandler } from '@angular/core';
import { UxUtil } from './uxutil';
import { Utilities } from '@microsoft/office-js-helpers';

export class ExceptionHandler implements ErrorHandler {
    handleError(exception: any, stackTrace?: any, reason?: string) {
        Utilities.error(exception);
        // appInsights.trackException(exception, 'Global Exception Handler', { 'global': 'true' });
        UxUtil.showErrorNotification('An unexpected error occurred.', [], exception);
    }
}

export const EXCEPTION_PROVIDER = { provide: ErrorHandler, useClass: ExceptionHandler };
