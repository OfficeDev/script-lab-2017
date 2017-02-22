#!/usr/bin/env node --harmony

let chalk = require('chalk');
let _ = require('lodash');
let { build, config } = require('./env.config');
let git = require('simple-git')();

let {TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSWORD } = process.env;

/* Check if the code is running inside of travis.ci. If not abort immediately. */
if (!TRAVIS) {
    exit('Not running inside of Travis. Skipping deploy', true);
}

if (!_.isString(AZURE_WA_USERNAME)) {
    exit('"AZURE_WA_USERNAME" is a required global variable', true);
}

if (!_.isString(AZURE_WA_PASSWORD)) {
    exit('"AZURE_WA_PASSWORD" is a required global variable', true);
}

if (!_.isString(AZURE_WA_SITE)) {
    exit('"AZURE_WA_SITE" is a required global variable', true);
}

/* Check if the branch name is valid. */
let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
if (!slot) {
    exit('Invalid branch name. Skipping deploy', true);
}

switch (slot) {
    case 'master':
    case 'dev':
    case 'edge':
    case 'build':
        slot = 'edge';
        break;
}

/* Check if there is a configuration defined inside of config/env.config.js. */
let buildConfig = config[slot];
if (buildConfig == null || slot === 'local') {
    exit('No deployment configuration found for ' + slot + '. Skipping deploy');
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
    + AZURE_WA_PASSWORD + '@'
    + AZURE_WA_SITE + '-'
    + slot + '.scm.azurewebsites.net:443/'
    + AZURE_WA_SITE + '.git';

console.log(chalk.bold.green('Deploying to ' + AZURE_WA_SITE + '-' + slot));

try {
    git.addConfig('user.name', 'Travis CI')
        .addConfig('user.email', AZURE_WA_USERNAME + 'microsoft.com')
        .checkout('HEAD')
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