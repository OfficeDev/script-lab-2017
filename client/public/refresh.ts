// import { Utilities, HostType, PlatformType } from '@microsoft/office-js-helpers';
// import { settings, environment, Messenger, MessageType } from '../app/helpers';

// window.addEventListener("message", receiveMessage, false);

// (async () => {
//     if (Utilities.platform) {
//         $('body').addClass(Utilities.platform);
//     }

//     await loadFirebug();
//     $('body').append(`<iframe id="heartbeat" src="${environment.current.config.runnerUrl}/heartbeat.html"></iframe>`);
// })();

// function loadFirebug() {
//     let script = $('<script type="text/javascript"></script>');
//     script.src = `${environment.current.config.runnerUrl}/assets/firebug/firebug-lite-debug.js#startOpened`;
//     $('head').appendChild(script);

//     return new Promise((resolve, reject) => {
//         if ((window as any).firebugLiteIsLoaded) {
//             return resolve();
//         }
//         else {
//             let interval = setInterval(() => {
//                 if ((window as any).firebugLiteIsLoaded) {
//                     clearInterval(interval);
//                     return resolve();
//                 }
//             }, 250);
//         }
//     });
// }

// function receiveMessage(event) {
//     var origin = event.origin || event.originalEvent.origin;
//     if (origin !== editorUrl) {
//         return;
//     }

//     if (!event || !event.data || !event.data.type) {
//         showError('Runner received a message with missing content');
//         return;
//     }

//     switch (event.data.type) {
//         case 'snippet':
//             loadStoredSnippet(event.data.message);
//             break;

//         case 'needs-reload':
//             hideAll();
//             $('#needs-reload').removeClass('hidden');
//             $('#needs-reload .fullpage__sub-title').text(
//                 'Tap anywhere to load "' + event.data.message + '"');
//             break;

//         case 'error':
//             showError(event.data.message);
//             break;

//         default:
//             showError("Unhandled runner event");
//             break;
//     }
// }

// function loadStoredSnippet(data) {
//     hideAll();
//     $('#progress').removeClass('hidden');
//     $('#progress .ms-progress-component__sub-title').text('Loading "' + data.snippet.name + '"');

//     var runnerRootUrl = window.location.protocol + "//" + window.location.host;
//     $.post(runnerRootUrl, {
//         snippet: jsyaml.safeDump(data.snippet),
//     })
//         .then(function (html) {
//             $('#snippet-title span').text(data.snippet.name);

//             var $wrapper = $('#snippet-frame-wrapper');
//             $wrapper.children('iframe').remove();

//             var iframe = document.createElement('iframe');
//             $wrapper.append(iframe);

//             var iframeWindow = iframe.contentWindow;

//             window.playgroundInitialize = function () {
//                 iframeWindow.console = window.console;
//                 if (isAddin) {
//                     iframeWindow['Office'] = window['Office'] || {};
//                 }
//             }

//             window.playgroundLoaded = function () {
//                 Firebug.chrome.open();
//                 Firebug.Console.clear();

//                 if (isAddin) {
//                     ['OfficeExtension', 'Excel', 'Word', 'OneNote'].forEach(
//                         function (namespace) {
//                             iframeWindow[namespace] = window[namespace];
//                         }
//                     );
//                 }

//                 hideAll();
//                 $('#snippet-frame-wrapper').removeClass('hidden');
//             }

//             iframeWindow.document.open();

//             iframeWindow.onerror = function () {
//                 console.error(arguments);
//             };

//             iframeWindow.document.write(html);
//             iframeWindow.document.close();

//             if (isAddin) {
//                 // Call the Office.initialize that the snippet just defined
//                 iframeWindow.document.body.onload = function () {
//                     Office.initialize();
//                 };
//             }
//         })
//         .fail(function (error) {
//             showError(error);
//         });
// }

// function dispatchReloadCall() {
//     hideAll();
//     $('#progress').removeClass('hidden');

//     var iframe = document.getElementById('heartbeat').contentWindow;
//     iframe.postMessage({ type: 'reload' }, editorUrl);
// }

// function showError(message) {
//     hideAll();
//     $('#error').removeClass('hidden');
//     $('#error').children('p').text(message);
// }

// function hideAll() {
//     $('.fullscreen').addClass('hidden');
// }

// function determineEditorUrl() {
//     if (window.location.host === 'localhost:8080') {
//         return 'http://localhost:3000';
//     }
//     if (window.location.host === 'addin-playground-runner-staging.azurewebsites.net') {
//         return 'https://addin-playground-staging.azurewebsites.net';
//     }

//     return 'https://addin-playground.azureedge.net';
// }

// function createUrl(start, paramsJson) {
//     var paramsArray = []
//     for (let paramName in paramsJson) {
//         paramsArray.push(encodeURIComponent(paramName) + '=' + encodeURIComponent(paramsJson[paramName]));
//     }
//     return start + '?' + paramsArray.join('&');
// }
