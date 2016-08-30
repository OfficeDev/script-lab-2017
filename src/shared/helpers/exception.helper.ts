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

        // On Office Online, the "//.../#/excel/addin" URL gets morphed and does not match any routes.
        // So instead, need to catch the exception and redirect to the general page.  
        if (exception.message === "Uncaught (in promise): Error: Cannot match any routes: ''") {
            window.location.replace(Utilities.playgroundBasePath);
            return;
        }

        UxUtil.showErrorNotification("An unexpected error occurred.", [], exception);
    }
}