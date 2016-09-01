import {ExceptionHandler} from '@angular/core';
import {UxUtil} from "./uxutil";
import {Utilities} from "./utilities";

export class ExceptionHelper extends ExceptionHandler {
    call(exception: any, stackTrace?: any, reason?: string) {
        console.group(exception.description || 'Handled Exception');
        console.error(exception);
        console.groupCollapsed('Stack Trace');
        console.error(stackTrace);
        console.groupEnd();
        console.groupEnd();

        console.log("Exception = " + Utilities.stringifyPlusPlus(exception));
        console.log(exception);

        UxUtil.showErrorNotification("An unexpected error occurred.", [], exception);
    }
}