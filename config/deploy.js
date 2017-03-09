#!/usr/bin/env node --harmony

let chalk = require('chalk');
let _ = require('lodash');
let { build, config } = require('./env.config');
let git = require('simple-git')();
let webpackConfig = require('./webpack.prod');
let webpack = require('webpack');
let { TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, TRAVIS_COMMIT_MESSAGE, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSWORD } = process.env;
process.env.NODE_ENV = process.env.ENV = 'production';

precheck();

if (TRAVIS_PULL_REQUEST === 'false') {
    /* Check if the branch name is valid. */
    let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
    if (!slot) {
        exit('Invalid branch name. Skipping deploy.', true);
    }

    switch (slot) {
        case 'master':
        case 'dev':
            slot = 'edge';
            break;
    }

    /* Check if there is a configuration defined inside of config/env.config.js. */
    let buildConfig = config[slot];
    if (buildConfig == null || slot === 'local') {
        exit('No deployment configuration found for ' + slot + '. Skipping deploy.');
    }

    /* If 'production' then apply the pull request only constraint. */
    if (slot === 'production') {
        slot = 'staging';
    }

    let editorUrl = 'https://'
        + AZURE_WA_USERNAME + ':'
        + AZURE_WA_PASSWORD + '@'
        + AZURE_WA_SITE + '-'
        + slot + '.scm.azurewebsites.net:443/'
        + AZURE_WA_SITE + '.git';

    let runnerUrl = 'https://'
        + AZURE_WA_USERNAME + ':'
        + AZURE_WA_PASSWORD + '@'
        + AZURE_WA_SITE + '-runner-'
        + slot + '.scm.azurewebsites.net:443/'
        + AZURE_WA_SITE + '.git';

    log('Deploying commit: ' + TRAVIS_COMMIT_MESSAGE + ' to ' + AZURE_WA_SITE + '-' + slot + '...');

    deployBuild(editorUrl, 'dist/client')
        .then(() => deployBuild(runnerUrl, 'dist/server'))
        .then(exit)
        .catch((err) => exit(err, true));
}

function deployBuild(url, path) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        try {
            git.silent(true)
                .addConfig('user.name', 'Travis CI')
                .addConfig('user.email', 'travis.ci@microsoft.com')
                .checkout('HEAD')
                .add([path, '-A', '-f'], (err) => {
                    if (err) {
                        return reject(err.replace(url, ''));
                    }
                })
                .commit(TRAVIS_COMMIT_MESSAGE, () => log('Pushing ' + path + '... Please wait...'))
                .push(['-f', '-q', url, 'HEAD:master'], (err) => {
                    if (err) {
                        return reject(err.replace(url, ''));
                    }

                    const end = Date.now();
                    log('Successfully deployed in' + (end - start) / 1000 + ' seconds.', 'green');
                    return resolve();
                });
        }
        catch (error) {
            return reject(err);
        }
    });
}

function log(message, color) {
    console.log(chalk.bold[color || 'cyan'](message));
}

function exit(reason, abort) {
    if (reason) {
        abort ? console.log(chalk.bold.red(reason)) : console.log(chalk.bold.yellow(reason));
    }

    return abort ? process.exit(1) : process.exit(0);
}

function precheck(skip) {
    if (skip) {
        return;
    }

    /* Check if the code is running inside of travis.ci. If not abort immediately. */
    if (!TRAVIS) {
        exit('Not running inside of Travis. Skipping deploy.', true);
    }

    /* Check if the username is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_USERNAME)) {
        exit('"AZURE_WA_USERNAME" is a required global variable.', true);
    }

    /* Check if the password is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_PASSWORD)) {
        exit('"AZURE_WA_PASSWORD" is a required global variable.', true);
    }

    /* Check if the website name is configured. If not abort immediately. */
    if (!_.isString(AZURE_WA_SITE)) {
        exit('"AZURE_WA_SITE" is a required global variable.', true);
    }
}