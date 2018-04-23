const { name, version, author } = require('../package.json');
const moment = require('moment');
const { startCase } = require('lodash');

/** NOTE: when adding local storage keys here, remember to add them for IntelliSense's sake in "ICompiledPlaygroundInfo" in playground.d.ts */
const localStorageKeys = {
    dummyUnusedKey: 'plyaground_dummy_unused_key',
    log: 'playground_log',
    hostSnippets_parameterized: 'playground_{0}_snippets',
    settings: 'playground_settings',
    originEnvironmentUrl: 'playground_origin_environment_url',
    redirectEnvironmentUrl: 'playground_redirect_environment_url',
    wacUrl: 'playground_wac_url',
    experimentationFlags: 'playground_experimentation_flags',
    trustedSnippets: 'playground_trusted_snippets',
    customFunctionsLastHeartbeatTimestamp: 'playground_custom_functions_last_heartbeat_timestamp',
    customFunctionsLastUpdatedCodeTimestamp: 'playground_custom_functions_last_updated_code_timestamp',
    customFunctionsCurrentlyRunningTimestamp: 'playground_custom_functions_currently_running_timestamp',
    lastPerfNumbersTimestamp: 'playground_last_perf_numbers_timestamp',
    language: 'playground_language'
};

const sessionStorageKeys = {
    environmentCache: 'playground_cache',
    intelliSenseCache: 'playground_intellisense'
};

const build = (() => {
    return {
        name: startCase(name),
        version: version,
        timestamp: moment().utc().valueOf(),
        humanReadableTimestamp: moment().utc().format('YYYY-MM-DD HH:mm a') + ' UTC',
        author: author
    };
})();

const thirdPartyAADAppClientId = 'd56fb06a-74be-4bd7-8ede-cbf2ea737328';
const feedbackUrl = 'https://github.com/OfficeDev/script-lab/issues';

const config = {
    local: {
        name: 'LOCAL',
        clientId: '',
        clientSecretLocalHost: '',
        instrumentationKey: null,
        editorUrl: 'https://localhost:3000',
        tokenUrl: 'https://localhost:3200/auth',
        runnerUrl: 'https://localhost:3200',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-beta',
        feedbackUrl,
        thirdPartyAADAppClientId,
    },
    edge: {
        name: 'EDGE',
        clientId: 'fb706d86cd846cea7baf',
        instrumentationKey: '07a066dc-d67f-44af-8f77-59cb6ee246a8',
        editorUrl: 'https://bornholm-edge.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-edge.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-edge.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-beta',
        feedbackUrl,
        thirdPartyAADAppClientId,
    },
    insiders: {
        name: 'INSIDERS',
        clientId: '786ba422740568d98ce3',
        instrumentationKey: 'b3f1f065-02a9-49d3-b75c-4586659f51ef',
        editorUrl: 'https://bornholm-insiders.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-insiders.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-insiders.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-beta',
        feedbackUrl,
        thirdPartyAADAppClientId,
    },
    staging: {
        name: 'STAGING',
        clientId: '55031174553ee45f92f4', // same as production
        instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b', // same as production
        editorUrl: 'https://bornholm-staging.azurewebsites.net',
        tokenUrl: 'https://bornholm-runner-staging.azurewebsites.net/auth',
        runnerUrl: 'https://bornholm-runner-staging.azurewebsites.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-prod',
        feedbackUrl,
        thirdPartyAADAppClientId,
    },
    production: {
        name: 'PRODUCTION',
        clientId: '55031174553ee45f92f4',
        instrumentationKey: '8e0b6b12-8d5e-4710-841d-7996a913f14b',
        editorUrl: 'https://script-lab.azureedge.net',
        tokenUrl: 'https://script-lab-runner.azureedge.net/auth',
        runnerUrl: 'https://script-lab-runner.azureedge.net',
        samplesUrl: 'https://raw.githubusercontent.com/OfficeDev/office-js-snippets/deploy-prod',
        feedbackUrl,
        thirdPartyAADAppClientId,
    }
};

// NOTE: Any changes to this data structure should also be copied to `playground.d.ts`
const safeExternalUrls = {
    playground_help: 'https://github.com/OfficeDev/script-lab/blob/master/README.md',
    ask: 'https://stackoverflow.com/questions/tagged/office-js',
    excel_api: 'https://dev.office.com/reference/add-ins/excel/excel-add-ins-reference-overview',
    word_api: 'https://dev.office.com/reference/add-ins/word/word-add-ins-reference-overview',
    onenote_api: 'https://dev.office.com/reference/add-ins/onenote/onenote-add-ins-javascript-reference',
    outlook_api: 'https://docs.microsoft.com/en-us/outlook/add-ins/reference',
    powepoint_api: 'https://dev.office.com/docs/add-ins/powerpoint/powerpoint-add-ins',
    project_api: 'https://dev.office.com/reference/add-ins/shared/projectdocument.projectdocument',
    generic_api: 'https://dev.office.com/reference/add-ins/javascript-api-for-office'
};

const experimentationFlagsDefaults = {
    customFunctions: false,
    customFunctionsShowDebugLog: false
};

class RedirectPlugin {
    apply(compiler) {
        compiler.plugin('compilation', (compilation) => {
            compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {
                let headOpeningTag = '<head>';
                let htmlHead = htmlPluginData.html.match(headOpeningTag);

                let { originEnvironmentUrl, redirectEnvironmentUrl } = localStorageKeys;

                const validRedirectLocations = [];
                for (var envName in config) {
                    validRedirectLocations.push(config[envName].editorUrl);
                }

                if (htmlHead && htmlHead.length > 0) {
                    htmlHead = htmlHead.index;
                    htmlPluginData.html = htmlPluginData.html.slice(0, htmlHead) +
                        headOpeningTag +
                        `
    <script>
        (function() {
            try {
                // Taken and slightly tweaked from office-js-helpers Authenticator class:
                // https://github.com/OfficeDev/office-js-helpers/blob/master/src/authentication/authenticator.ts
                function extractParams(segment) {
                    if (segment == null || segment.trim() === '') {
                        return null;
                    }
                    var params = {};
                    var regex = /([^&=]+)=([^&]*)/g;
                    var matchParts;
                    while ((matchParts = regex.exec(segment)) !== null) {
                        params[decodeURIComponent(matchParts[1])] = decodeURIComponent(matchParts[2]);
                    }
                    return params;
                }

                function isAllowedUrl(url) {
                    if (url.length === 0) {
                        return true;
                    }

                    var validRedirectLocations = ${JSON.stringify(validRedirectLocations)};

                    return validRedirectLocations.some(function(location) {
                        return location.indexOf(url) === 0;
                    });
                }

                var params = extractParams(window.location.href.split('?')[1]) || {};
                var originUrl = (params["originEnvironment"] || "").trim();
                var targetUrl = (params["targetEnvironment"] || "").trim();

                let urlsAreOk = isAllowedUrl(originUrl) && isAllowedUrl(targetUrl);
                if (!urlsAreOk) {
                    throw new Error("Invalid query parameters for target or origin environments");
                }

                // Set target environment for origin environment to redirect to
                if (targetUrl.length > 0) {
                    targetUrl = decodeURIComponent(targetUrl)
                    // Clear origin environment's local storage if target = origin
                    if (window.location.href.toLowerCase().indexOf(targetUrl) === 0) {
                        window.localStorage.removeItem("${redirectEnvironmentUrl}");
                        return;
                    }

                    window.localStorage.setItem("${redirectEnvironmentUrl}", targetUrl);
                }

                // Redirect origin environment to target
                // Note: Due to bug in IE (https://stackoverflow.com/a/40770399),
                // Local Storage may get out of sync across tabs.  To fix this,
                // set a value of some key, and this will ensure that localStorage is refreshed.
                window.localStorage.setItem("${localStorageKeys.dummyUnusedKey}", null);
                var redirectUrl = window.localStorage.getItem("${redirectEnvironmentUrl}");
                if (redirectUrl) {
                    var originParam = [
                        (window.location.search ? "&" : "?"),
                        "originEnvironment=",
                        encodeURIComponent(window.location.origin)
                    ].join("");

                    window.location.replace([
                        redirectUrl,
                        window.location.pathname,
                        window.location.search,
                        originParam,
                        window.location.hash
                    ].join(""));
                }

                // Point app environment back to origin if user is not in origin
                if (originUrl.length > 0) {
                    window.localStorage.setItem("${originEnvironmentUrl}",
                        decodeURIComponent(originUrl).toLowerCase());
                }

                // If reached here, environment is already configured
                return;

            } catch (e) {
                console.error("Error redirecting the environments, staying on current page", e);
            }
        })();
    </script>
                        ` +
                        htmlPluginData.html.slice(htmlHead + headOpeningTag.length);
                }
                callback(null, htmlPluginData);
            });
        });
    }
}


exports.build = build;
exports.config = config;
exports.safeExternalUrls = safeExternalUrls;
exports.localStorageKeys = localStorageKeys;
exports.sessionStorageKeys = sessionStorageKeys;
exports.experimentationFlagsDefaults = experimentationFlagsDefaults;
exports.RedirectPlugin = RedirectPlugin;

// NOTE: Data in this file gets propagated to JS on client pages
// via the "new webpack.DefinePlugin({ PLAYGROUND: ... }) definition
// in "webpack.common.js".  If you add anything to these exports
// that you want other parts of the system to import, be sure
// to modify the PLAYGROUND definition in "webpack.common.js".
