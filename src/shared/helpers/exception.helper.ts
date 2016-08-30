import {ExceptionHandler} from '@angular/core';
import {UxUtil} from "./uxutil";

export class ExceptionHelper extends ExceptionHandler {
    call(exception: any, stackTrace?: any, reason?: string) {
        console.group(exception.description || 'Handled Exception');
        console.error(exception);
        console.groupCollapsed('Stack Trace');
        console.error(stackTrace);
        console.groupEnd();
        console.groupEnd();

        UxUtil.showErrorNotification("An unexpected error occurred.", [], exception);
    }
}