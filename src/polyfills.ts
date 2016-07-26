// Polyfills

// import 'ie-shim'; // Internet Explorer 9 support


// import 'core-js/es6';
// Added parts of es6 which are necessary for your project or your browser support requirements.
import 'core-js/es6';
import 'reflect-metadata';
require('zone.js/dist/zone');

// Fabric & Bootstrap
require('office-ui-fabric/dist/css/fabric.min.css');
require('office-ui-fabric/dist/css/fabric.components.min.css');

// Spinner & Theme
require('./assets/styles/spinner.scss');
require('./assets/styles/globals.scss');

if ('production' === process.env.ENV) {
    // Production
} else {
    // Development
    Error.stackTraceLimit = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
}