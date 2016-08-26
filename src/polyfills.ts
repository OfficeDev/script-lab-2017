import 'core-js';
import 'reflect-metadata';
import 'zone.js/dist/zone';

if ('production' === process.env.ENV) {
} else {
    Error.stackTraceLimit = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
}