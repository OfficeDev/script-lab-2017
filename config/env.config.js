let { name, version, author } = require('../package.json');
let { startCase } = require('lodash');

const build = (() => {
    let timestamp = new Date().getTime();

    return {
        name: startCase(name),
        version,
        timestamp,
        author
    };
})();

const config = {
    local: {
        name: 'LOCAL',
        clientId: '07e7d67e660300b09c38',
        instrumentationKey: null,
        editorUrl: 'https://localhost:3000',
        tokenUrl: 'https://localhost:3200/auth',
        runnerUrl: 'https://localhost:3200',
        samplesUrl: 'https://raw.githubusercontent.com/WrathOfZombies/samples/prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    },
    edge: {
        name: 'EDGE',
        clientId: '95435036e70d23b8549f',
        instrumentationKey: '07a066dc-d67f-44af-8f77-59cb6ee246a8',
        editorUrl: 'https://bornholm-edge.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-edge.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-edge.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/WrathOfZombies/samples/prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    },
    insiders: {
        name: 'INSIDERS',
        clientId: '31ba59b73d83195e58dc',
        instrumentationKey: 'b3f1f065-02a9-49d3-b75c-4586659f51ef',
        editorUrl: 'https://bornholm-insiders.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-insiders.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-insiders.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/WrathOfZombies/samples/prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    },
    production: {
        name: 'PRODUCTION',
        clientId: '8d19e9bbcea2a1cee274',
        instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b',
        editorUrl: 'https://bornholm.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner.azurewebsites.net/auth/production',
        runnerUrl: 'https://bornholm-runner.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/WrathOfZombies/samples/prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    },
    cdn: {
        name: 'PRODUCTION',
        clientId: '8d19e9bbcea2a1cee274',
        instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b',
        editorUrl: 'https://bornholm.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/WrathOfZombies/samples/prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    }
};

exports.build = build;
exports.config = config;