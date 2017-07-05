const { name, version, author } = require('../package.json');
const moment = require('moment');
const { startCase } = require('lodash');

const build = (() => {
    return {
        name: startCase(name),
        version: version,
        timestamp: moment().utc().valueOf(),
        humanReadableTimestamp: moment().utc().format('YYYY-MM-DD HH:mm a') + ' UTC',
        author: author
    };
})();

const config = {
    local: {
        name: 'LOCAL',
        clientId: '',
        instrumentationKey: null,
        editorUrl: 'https://localhost:3000',
        tokenUrl: 'https://localhost:3200/auth',
        runnerUrl: 'https://localhost:3200',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-beta',
        feedbackUrl: 'https://github.com/OfficeDev/script-lab/issues',
    },
    edge: {
        name: 'EDGE',
        clientId: '95435036e70d23b8549f',
        instrumentationKey: '07a066dc-d67f-44af-8f77-59cb6ee246a8',
        editorUrl: 'https://bornholm-edge.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-edge.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-edge.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-beta',
        feedbackUrl: 'https://github.com/OfficeDev/script-lab/issues',
    },
    insiders: {
        name: 'INSIDERS',
        clientId: '31ba59b73d83195e58dc',
        instrumentationKey: 'b3f1f065-02a9-49d3-b75c-4586659f51ef',
        editorUrl: 'https://bornholm-insiders.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-insiders.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-insiders.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-prod',
        feedbackUrl: 'https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_IQfl6RcdlChED7PZI6qXNURUo2UFBUR1YxMkwxWFBLUTRMUE9HRENOWi4u',
    },
    production: {
        name: 'PRODUCTION',
        clientId: '55031174553ee45f92f4',
        instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b',
        editorUrl: 'https://script-lab.azureedge.net',
        tokenUrl: 'https://script-lab-runner.azureedge.net/auth',
        runnerUrl: 'https://script-lab-runner.azureedge.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-prod',
        feedbackUrl: 'https://github.com/OfficeDev/script-lab/issues',
    }
};

const RedirectPlugin = function(options) { 
    this.apply = function(compiler) {
        compiler.plugin('compilation', function(compilation) {
            compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData, callback) {
                let htmlHead = htmlPluginData.html.match('<head>');
                if (htmlHead) {
                    htmlHead = htmlHead.index;
                    htmlPluginData.html = htmlPluginData.html.slice(0, htmlHead) + '<head>' +
                    `<script>
                        var getParameterByName = function(name) {
                            var url = window.location.search;
                            var queryExp = new RegExp("[\\?&]"+name+"=([^&#]*)", "i");
                            var match = queryExp.exec(url);
                            if (match && match.length > 1) {
                                return match[1];
                            }
                            return null;
                        };
                        var originUrl = getParameterByName("originEnvironment");
                        var newUrl = getParameterByName("newEnvironment");
                        if (newUrl) {
                            newUrl = decodeURIComponent(newUrl);
                            if (window.location.href.match(newUrl)) {
                                window.localStorage.removeItem("environmentConfig");
                            } else {
                                window.localStorage.setItem("environmentConfig", newUrl);
                            }
                        }

                        if (window.localStorage.getItem("environmentConfig")) {
                            var originParam = "" + 
                            (window.location.search ? "&" : "?") + 
                            "originEnvironment=" + 
                            encodeURIComponent(window.location.origin);

                            window.location.href = window.localStorage.getItem("environmentConfig") +
                            window.location.pathname +
                            window.location.search + 
                            originParam + 
                            window.location.hash;
                        }

                        if (originUrl && !window.localStorage.getItem("originEnvironment")) {
                            window.localStorage.setItem("originEnvironment", decodeURIComponent(originUrl));
                        }
                    </script>` + 
                    htmlPluginData.html.slice(htmlHead + '<head>'.length);
                }
                callback(null, htmlPluginData);
            });
        });
    };
};

exports.build = build;
exports.config = config;
exports.RedirectPlugin = RedirectPlugin;
