#!/usr/bin/env node --harmony

let chalk = require('chalk');
let _ = require('lodash');
let { build, config } = require('./env.config');
let git = require('simple-git')();

let {TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSOWRD } = process.env;

/* Check if the code is running inside of travis.ci. If not abort immediately. */
if (!TRAVIS) {
    exit('Not running inside of Travis. Skipping deploy', true);
}

/* Check if the branch name is valid. */
let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
if (!slot) {
    exit('Invalid branch name. Skipping deploy', true);
}

/* Check if there is a configuration defined inside of config/env.config.js. */
let buildConfig = config[slot];
if (buildConfig == null || slot === 'local') {
    exit('No deploy configuration found for ' + slot + '. Skipping deploy');
}

/* If 'production' then apply the pull request only constraint. */
if (slot === 'production') {
    if (!TRAVIS_PULL_REQUEST) {
        exit('Deployments to "production" can only be done via pull requests.');
    }
    else {
        slot = 'staging';
    }
}

let url = 'https://'
    + AZURE_WA_USERNAME + ':'
    + AZURE_WA_PASSOWRD + '@'
    + AZURE_WA_SITE + '-'
    + slot + '.scm.azurewebsites.net:443/'
    + AZURE_WA_SITE + '.git';

console.log(chalk.bold.green('Deploying to ' + url));

try {
    git.checkout('HEAD')
        .add(['-u', '-f'])
        .reset(['--', 'node_modules/**'])
        .commit('Deployment commit')
        .push(['-f', '-q', url, 'HEAD:refs/heads/master'])
        .then(
        () => exit('Successfully deployed to https://' + AZURE_WA_SITE + '-' + slot + '.azurewebsites.net'),
        (error) => exit(error, true)
        );
}
catch (error) {
    exit(error, true);
}

function exit(reason, abort) {
    if (_.isString(reason)) {
        reason += '. Skipping deployment.'
    }

    if (reason) {
        abort ? console.log(chalk.bold.red(reason)) : console.log(chalk.bold.yellow(reason));
    }

    return abort ? process.exit(1) : process.exit(0);
}