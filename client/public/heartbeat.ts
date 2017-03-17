// import { Authenticator } from '@microsoft/office-js-helpers';
// import { settings, environment, Messenger, MessageType } from '../app/helpers';

// (async () => {
//     let current: ISnippet = null;

//     await environment.initialize();
//     let messenger = new Messenger(environment.current.config.runnerUrl);

//     let params = Authenticator.getUrlParams(location.href, location.origin, '?') as any;
//     if (params == null || params.host == null) {
//         messenger.send(MessageType.ERROR, 'Invalid runner state, missing "host" parameter. Please close and try again.');
//         return;
//     }

//     messenger.listen().subscribe(({ type, message }) => {
//         if (type === MessageType.RELOAD) {
//             initialize();
//         }
//     });

//     setInterval(() => {
//         let currentSnippet = settings.current.lastOpened;
//         if (currentSnippet == null) {
//             return;
//         }
//         else if (currentSnippet.id == null) {
//             return messenger.send(MessageType.ERROR, 'Invalid snippet. Please close and try again.');
//         }
//         else {
//             if (!isEquals(currentSnippet)) {
//                 return initialize();
//             }
//             else if (currentSnippet.modified_at !== current.modified_at) {
//                 return messenger.send(MessageType.RELOAD, currentSnippet.id);
//             }
//         }
//     }, 200);


//     function initialize() {
//         let snippet = settings.current.lastOpened;
//         if (snippet == null || snippet.id == null) {
//             messenger.send(MessageType.ERROR, 'Please create or open a snippet in the editor.');
//             return null;
//         }

//         messenger.send(MessageType.SNIPPET, {
//             snippet: snippet,
//             refreshUrl: window.location.origin + '/refresh.html'
//         });

//         return snippet;
//     }

//     function isEquals(snippet: ISnippet) {
//         if (this.current == null || snippet == null) {
//             return false;
//         }
//         else if (snippet.id == null || snippet.id.trim() === '') {
//             return false;
//         }
//         else if (snippet.id !== this.current.id) {
//             return false;
//         }
//         else {
//             return true;
//         }
//     }
// })();
