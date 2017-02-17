let {name, version, author} = require('../package.json');
let _ = require('lodash');

const build = () => {
    let timestamp = new Date().getTime();

    return {
        name: _.startCase(name),
        version,
        timestamp,
        author
    };
}

const config = () => {
    return {
        local: {
            name: 'LOCAL',
            clientId: '95435036e70d23b8549f',
            instrumentationKey: null,
            tokenUrl: 'https://localhost:3200/auth',
            runnerUrl: 'https://localhost:3200',
        },
        edge: {
            name: 'EDGE',
            clientId: '95435036e70d23b8549f',
            instrumentationKey: '07a066dc-d67f-44af-8f77-59cb6ee246a8',
            tokenUrl: 'https://bornholm-runner-edge.azurewebsites.net/auth',
            runnerUrl: 'https://bornholm-runner-edge.azurewebsites.net',
        },
        insiders: {
            name: 'INSIDERS',
            clientId: '8d19e9bbcea2a1cee274',
            instrumentationKey: 'b3f1f065-02a9-49d3-b75c-4586659f51ef',
            tokenUrl: 'https://bornholm-runner-insiders.azurewebsites.net/auth',
            runnerUrl: 'https://bornholm-runner-insiders.azurewebsites.net'
        },
        production: {
            name: 'PRODUCTION',
            clientId: '8d19e9bbcea2a1cee274',
            instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b',
            tokenUrl: 'https://bornholm-runner.azurewebsites.net/auth',
            runnerUrl: 'https://bornholm-runner.azurewebsites.net'
        }
    };
}

exports.build = build;
exports.config = config;