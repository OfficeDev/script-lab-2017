import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
// import ComingSoon from './components/CustomFunctionsDashboard/ComingSoon';

// import { environment } from '../app/helpers';

// Note: Office.initialize is already handled outside in the html page,
// setting "window.playground_host_ready = true;""

document.getElementById('loading')!.style.display = 'none';
ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
// (async () => {
//   environment.initializePartial({ host: 'EXCEL' });

//   await new Promise(resolve => {
//     const interval = setInterval(() => {
//       if ((window as any).playground_host_ready) {
//         clearInterval(interval);
//         return resolve();
//       }
//     }, 100);
//   });

//   if (
//     Office &&
//     Office.context &&
//     Office.context.requirements &&
//     Office.context.requirements.isSetSupported('CustomFunctions', 1.1)
//   ) {
//     ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
//   } else {
//     ReactDOM.render(<ComingSoon />, document.getElementById(
//       'root',
//     ) as HTMLElement);
//   }
// })();
