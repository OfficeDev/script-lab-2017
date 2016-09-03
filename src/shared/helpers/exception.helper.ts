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

        console.error("Exception = " + Utilities.stringifyPlusPlus(exception));
        console.error(exception);

        if (Utilities.stringifyPlusPlus(exception).indexOf('Attempt to use a destroyed view') >= 0) {
            return; // skip showing error notification to user.  silently swallow.
        }

        if (Utilities.stringifyPlusPlus(exception).indexOf("Uncaught (in promise): Error: Cannot match any routes: 'excel'") >= 0) {
            window.location.href = Utilities.playgroundBasePath;
            return;
        }

        UxUtil.showErrorNotification("An unexpected error occurred.", [], exception);
    }
}