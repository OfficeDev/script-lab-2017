import {Utilities} from './utilities';

export class ExpectedError {
    // Placeholder class just to indicate that the error was in fact an expected rejection.
}

// TODO rename file to UxUtil
export class UxUtil {
    static showErrorNotification(e: any) {
        if (e instanceof ExpectedError) {
            return;
        }
        
        var message = Utilities.stringifyPlusPlus(e);
        console.log(message);

        UxUtil.showDialog("Error", message, "OK");
    }

    static extractErrorMessage(e: any): string {
        if (e instanceof Error) {
            return e.message;
        } else {
            return e;
        }
    }       

    static showDialog(title: string, message: string, buttons: string[]|string): Promise<string> {
        return new Promise(function(resolve) {
            $(document).ready(function() {
                var $app = $('body app.app');
                var $dialogAndOverlay = $('.appwide-overlay-dialog');
                var $dialogRoot = $('.appwide-overlay-dialog.ui-dialog');
                $('.ui-dialog-title', $dialogRoot).text(title);
                $('.ui-dialog-content p', $dialogRoot).text(message);
                
                var buttonsArray: string[];
                if (_.isString(buttons)) {
                    buttonsArray = [buttons];
                } else if (_.isArray(buttons)) {
                    buttonsArray = buttons;
                }
                
                var $buttonPane = $('.ui-dialog-buttonpane', $dialogRoot);
                $buttonPane.empty();
                buttonsArray.forEach(function(buttonLabel) {
                    var $button = $('<button type="button" class="ui-button ui-corner-all ui-widget"></button>');
                    
                    $button.text(buttonLabel);
                    $button.click(function() {
                        $dialogAndOverlay.hide();
                        resolve(buttonLabel);
                    });
                    $buttonPane.append($button);
                });

                $dialogAndOverlay.show();
            })
        });
    }
}