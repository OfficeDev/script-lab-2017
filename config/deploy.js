#!/usr/bin/env node --harmony

let chalk = require('chalk');
let _ = require('lodash');
let { build, config } = require('./env.config');
let git = require('simple-git')();
let webpackConfig = require('./webpack.prod');
let webpack = require('webpack');
let {TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, TRAVIS_COMMIT_MESSAGE, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSWORD } = process.env;
process.env.NODE_ENV = process.env.ENV = 'production';

precheck();

if (TRAVIS_PULL_REQUEST !== 'false') {
    generateBuild()
        .then(exit)
        .catch((err) => exit(err, true));
}
else {
    /* Check if the branch name is valid. */
    let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
    if (!slot) {
        exit('Invalid branch name. Skipping deploy.', true);
    }

    switch (slot) {
        case 'master':
            slot = 'edge';
            break;
    }

    /* Check if there is a configuration defined inside of config/env.config.js. */
    let buildConfig = config[slot];
    if (buildConfig == null || slot === 'local') {
        exit('No deployment configuration found for ' + slot + '. Skipping deployment.');
    }

    /* If 'production' then apply the pull request only constraint. */
    if (slot === 'production') {
        slot = 'staging';
    }

    generateBuild()
        .then(deployBuild)
        .then(exit)
        .catch((err) => exit(err, true));
}

function generateBuild() {
    return new Promise((resolve, reject) => {
        log('Building commit: ' + TRAVIS_COMMIT_MESSAGE);
        const start = Date.now();
        webpack(webpackConfig, (err, stats) => {
            stats.chunks = false;
            stats.hash = true;
            stats.version = true;
            stats.modules = true;

            if (err) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                let json = stats.toJson();
                return reject(err);
            }

            const end = Date.now();
            log('\n\nGenerated build for commit: ' + TRAVIS_COMMIT_MESSAGE + ' in ' + (end - start) / 1000 + ' seconds.');
            log(webpackConfig.build.name + ' - v' + webpackConfig.build.version + '.\n\n', 'magenta');
            return resolve();
        })
    });
}

function deployBuild() {
    return new Promise((resolve, reject) => {
        let url = 'https://'
            + AZURE_WA_USERNAME + ':'
            + AZURE_WA_PASSWORD + '@'
            + AZURE_WA_SITE + '-'
            + slot + '.scm.azurewebsites.net:443/'
            + AZURE_WA_SITE + '.git';

        log('Deploying commit: ' + TRAVIS_COMMIT_MESSAGE + ' to ' + AZURE_WA_SITE + '-' + slot + '...');

        const start = Date.now();
        try {
            git.silent(true)
                .addConfig('user.name', 'Travis CI')
                .addConfig('user.email', 'travis.ci@microsoft.com')
                .checkout('HEAD')
                .add(['.', '-A', '-f'], (err) => {
                    if (err) {
                        return reject(err);
                    }
                })
                .reset(['--', 'node_modules/**'])
                .commit(TRAVIS_COMMIT_MESSAGE, () => log('Pushing deployment... Please wait...'))
                .push(['-f', '-q', url, 'HEAD:master'], (err) => {
                    if (err) {
                        return reject('Failed to push deployment.');
                    }

                    log('Successfully deployed to https://' + AZURE_WA_SITE + '-' + slot + '.azurewebsites.net in' + (end - start) / 1000 + ' seconds.', 'green');
                    const end = Date.now();
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
        exit('Not running inside of Travis. Skipping build.', true);
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