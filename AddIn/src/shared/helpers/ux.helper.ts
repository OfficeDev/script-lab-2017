import {Utilities} from './utilities';

export class ExpectedError {
    // Placeholder class just to indicate that the error was in fact an expected rejection.
}

export class UxUtil {
    static showErrorNotification(messageOrMessageArray: string | string[], e: any) : Promise<string> {
        if (e instanceof ExpectedError) {
            return;
        }

        console.log(Utilities.stringifyPlusPlus(messageOrMessageArray));
        console.log(Utilities.stringifyPlusPlus(e));

        var messages: string[] = UxUtil.getArrayOfMessages(messageOrMessageArray);
        messages.push(UxUtil.extractErrorMessage(e));

        return UxUtil.showDialog("Error", messages, "OK");
    }

    static catchError(messageOrMessageArray: string | string[]): (e: Error) => Promise<string> {
        return (e: Error) => UxUtil.showErrorNotification(messageOrMessageArray, e);
    } 

    static extractErrorMessage(e: any): string {
        if (e instanceof Error) {
            return e.message;
        } else {
            return e;
        }
    }       

    static showDialog(title: string,
        messageOrMessageArray: string | string[],
        buttons: string[]|string
    ): Promise<string> {
        return new Promise(function(resolve) {
            $(document).ready(function() {
                var $app = $('body app.app');
                var $dialogAndOverlay = $('.appwide-overlay-dialog');
                var $dialogRoot = $('.appwide-overlay-dialog.ui-dialog');
                $('.ui-dialog-title', $dialogRoot).text(title);

                var $dialogContent = $('.ui-dialog-content', $dialogRoot).empty();

                UxUtil.getArrayOfMessages(messageOrMessageArray).forEach((message) => {
                    $dialogContent.append($(document.createElement('p')).text(message));
                })
                
                var buttonsArray: string[];
                if (_.isArray(buttons)) {
                    buttonsArray = buttons;
                } else {
                    buttonsArray = [buttons];
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

    static getArrayOfMessages(messageOrMessageArray: string | string[]) {
        var messages: string[];
        if (_.isArray(messageOrMessageArray)) {
            messages = messageOrMessageArray;
        } else {
            messages = [messageOrMessageArray];
        }

        var result = [];
        messages.map((message) => message.split('\n')).forEach((messageArray) => {
            messageArray.forEach((message) => {
                result.push(message);
            })
        })

        return result;
    }
}