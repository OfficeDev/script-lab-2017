import {Utilities} from './utilities';

export class ExpectedError {
    // Placeholder class just to indicate that the error was in fact an expected rejection.
}

export class ErrorUtil {
    static notifyUserOfError(e: any) {
        console.log(e);
        console.log(Utilities.stringifyPlusPlus(e));

        // TODO: use something more elegant than an Alert!
        alert (ErrorUtil.extractMessage(e))
    }

    static extractMessage(e: any): string {
        if (e instanceof Error) {
            return e.message;
        } else {
            return e;
        }
    }       

}