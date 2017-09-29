import { Strings } from '../app/strings';
import { Authenticator, UI } from '@microsoft/office-js-helpers';
// import { environment } from '../app/helpers/';

import '../assets/styles/extras.scss';

const ActionParamName: keyof FilePickerParamData = 'filePicker_action';
const ClientIdParamName: keyof FilePickerParamData = 'client_id';

const FilePickerSessionStorageKey = 'filePicker';

declare const OneDrive;

let strings: ClientStrings;

tryCatch(() => {
    strings = Strings();

    document.title = strings.playgroundName + ' - ' + strings.Auth.authenticationRedirect;

    let filePickerParams: FilePickerParamData = Authenticator.extractParams(window.location.href.split('?')[1]) || {};
    let hasActionAndClientIdInfo =
        filePickerParams[ActionParamName] &&
        filePickerParams[ClientIdParamName];

    if (!hasActionAndClientIdInfo && window.sessionStorage[FilePickerSessionStorageKey]) {
        filePickerParams = JSON.parse(window.sessionStorage[FilePickerSessionStorageKey]);
    }

    if (typeof filePickerParams.is_office_host === 'string') {
        filePickerParams.is_office_host =
            ((filePickerParams.is_office_host as any) as string).toLowerCase() === 'true';
    }

    // At this point, should have a client ID 
    if (!filePickerParams.client_id) {
        throw new Error(strings.FilePicker.invalidParametersPassedInForFilePicker);
    }

//     // if (authRequestParams.auth_action === 'login') {
//     //     setSubtitleText(strings.Auth.authenticatingOnBehalfOfSnippet);
//     // }

    if (filePickerParams.is_office_host) {
        // Wait for Office.initialize before proceeding with the flow
        Office.initialize = () => proceedWithFilePickerInit(filePickerParams);
    } else {
        proceedWithFilePickerInit(filePickerParams);
    }
});

function proceedWithFilePickerInit(filePickerRequest: FilePickerParamData) {
    tryCatch(() => {

        (window as any).launchOneDrivePicker = () => {
            const odOptions = {
                clientId: '6ce4017d-3106-4ce7-9f98-0ab566a66b61',
                parentDiv: window.document.getElementById('filepicker'),
                success: (files) => {
                    const message = {
                        type: 'files',
                        files: files
                    };
                    if (filePickerRequest.is_office_host) {
                        Office.context.ui.messageParent(JSON.stringify(message));
                    } else {
                        if (window.opener) {
                            window.opener.postMessage(JSON.stringify(message), window.opener.location);
                        }
                    }
                }
            };
            OneDrive.open(odOptions);
        };

//         if (!authRequest) {
//             throw new Error(strings.unexpectedError);
//         }

//         if (authRequest.auth_action === 'login') {
//             const hasHash = window.location.href.indexOf('#') > 0;
//             if (hasHash) {
//                 const authResponseKeyValues = Authenticator.extractParams(window.location.href.split('#')[1]);
//                 const accessToken = authResponseKeyValues['access_token'];
//                 const expiresIn = authResponseKeyValues['expires_in'];
//                 if (accessToken) {
//                     const message = {
//                         type: 'auth',
//                         message: {
//                             accessToken: accessToken,
//                             expiresIn: expiresIn
//                         }
//                     };
//                     if (authRequest.is_office_host) {
//                         Office.context.ui.messageParent(JSON.stringify(message));
//                     } else {
//                         if (window.opener) {
//                             window.opener.postMessage(JSON.stringify(message), environment.current.config.runnerUrl);
//                         } else {
//                             setSubtitleText(strings.Auth.yourAccessTokenIs);
//                             const accessTokenInputBox = (document.getElementById('access-token-if-no-redirect') as HTMLInputElement);
//                             accessTokenInputBox.value = accessToken;
//                             accessTokenInputBox.style.visibility = 'visible';
//                             accessTokenInputBox.focus();
//                             accessTokenInputBox.setSelectionRange(0, accessTokenInputBox.value.length);
//                             hideProgressFooter();
//                         }
//                     }

//                     return;
//                 } else if (authResponseKeyValues['error']) {
//                     throw new Error(authResponseKeyValues['error'] + ': ' + authResponseKeyValues['error_description']);
//                 } else {
//                     throw new Error(strings.Auth.invalidAuthResponseReceived);
//                 }
//             }

//             if (authRequest[ClientIdParamName]) {
//                 return;
//             }
//         }
//         throw new Error(strings.unexpectedError);
    });
}

/*
    Helpers
*/

function tryCatch(callback: () => void) {
    try {
        callback();
    } catch (e) {
        UI.notify(strings.FilePicker.filePickerError, e);
    }
}





// function hideProgressFooter() {
//     (document.getElementsByClassName('ms-progress-component__footer')[0] as HTMLDivElement).style.visibility = 'hidden';
// }

// function setSubtitleText(text) {
//     const element = document.getElementById('subtitle');
//     element.textContent = text;
//     element.style.visibility = 'visible';
// }
