#!/usr/bin/env node --harmony

let path = require('path');
let fs = require('fs');
let chalk = require('chalk');
let _ = require('lodash');
let { build, config } = require('./env.config');
let shell = require('shelljs');
let webpackConfig = require('./webpack.prod');
let webpack = require('webpack');

let { TRAVIS, TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, AZURE_WA_USERNAME, AZURE_WA_SITE, AZURE_WA_PASSWORD } = process.env;
let TRAVIS_COMMIT_MESSAGE_SANITIZED = process.env['TRAVIS_COMMIT_MESSAGE'].replace(/\W/g, '_');

process.env.NODE_ENV = process.env.ENV = 'production';

precheck();

/* If running inside of a pull request then skip deploy */
if (TRAVIS_PULL_REQUEST !== 'false') {
    exit('Skipping deploy for pull requests');
    return;
}

/* Check if the branch name is valid. */
let slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
if (slot == null) {
    exit('Invalid branch name. Skipping deploy.', true);
}

let buildConfig;
switch (slot) {
    case 'master':
        buildConfig = config['edge'];
        slot = 'edge';
        break;

    case 'insiders':
        buildConfig = config['insiders'];
        slot = 'insiders';
        break;

    case 'production':
        buildConfig = config['production'];
        slot = 'staging';
        break;

    default:
        buildConfig = null;
        exit('No deployment configuration found for ' + slot + '. Skipping deploy.');
}

const URL = 'https://' + AZURE_WA_SITE + '-' + slot + '.azurewebsites.net';

const EDITOR_URL = 'https://'
    + AZURE_WA_USERNAME + ':'
    + AZURE_WA_PASSWORD + '@'
    + AZURE_WA_SITE + '-'
    + slot + '.scm.azurewebsites.net:443/'
    + AZURE_WA_SITE + '.git';

const RUNNER_URL = 'https://'
    + AZURE_WA_USERNAME + ':'
    + AZURE_WA_PASSWORD + '@'
    + AZURE_WA_SITE + '-runner-'
    + slot + '.scm.azurewebsites.net:443/'
    + AZURE_WA_SITE + '-runner.git';

log('Deploying commit: "' + TRAVIS_COMMIT_MESSAGE_SANITIZED + '" to ' + AZURE_WA_SITE + '-' + slot + '...');
deployBuild(EDITOR_URL, 'dist/client');
deployBuild(RUNNER_URL, 'dist/server');

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

function deployBuild(url, folder) {
    try {
        let current_path = path.resolve();
        let next_path = path.resolve(folder);
        shell.cd(next_path);
        const start = Date.now();
        if (url === EDITOR_URL) {
            buildAssetHistory(url, next_path);
        }
        shell.exec('git init');
        shell.exec('git config --add user.name "Travis CI"');
        shell.exec('git config --add user.email "travis.ci@microsoft.com"');
        let result = shell.exec('git add -A');
        if (result.code !== 0) {
            shell.echo(result.stderr);
            exit('An error occurred while adding files...', true);
        }
        result = shell.exec('git commit -m "' + TRAVIS_COMMIT_MESSAGE_SANITIZED + '"');
        if (result.code !== 0) {
            shell.echo(result.stderr);
            exit('An error occurred while commiting files...', true);
        }
        log('Pushing ' + folder + ' to ' + URL + '... Please wait...');
        result = shell.exec('git push ' + url + ' -q -f -u HEAD:refs/heads/master', { silent: true });
        if (result.code !== 0) {
            exit('An error occurred while deploying ' + folder + ' to ' + URL + '...', true);
        }
        const end = Date.now();
        log('Successfully deployed in ' + (end - start) / 1000 + ' seconds.', 'green');
        shell.cd(current_path);
    }
    catch (error) {
        log('Deployment failed...', 'red');
        console.log(error);
    }
}

function buildAssetHistory(url, folder) {
    shell.exec('git clone ' + url + ' current_build');
    shell.cp('-n', ['current_build/*.js', 'current_build/*.css'], '.');
    let now = (new Date().getTime()) / 1000;
    let oldHistoryPath = path.resolve(folder, 'current_build/history.json');
    let newHistoryPath = path.resolve(folder, 'history.json');
    let oldAssetsPath = path.resolve(folder, 'current_build/bundles');
    let newAssetsPath = path.resolve(folder, 'bundles');

    // Parse old history file if it exists
    let history = {};
    if (fs.existsSync(oldHistoryPath)) {
        history = JSON.parse(fs.readFileSync(oldHistoryPath).toString());
    }

    // Add new asset files to history, with current timestamp; exclude chunk files
    let newAssets = fs.readdirSync(newAssetsPath);
    for (asset of newAssets) {
        if (!(/chunk.js/i.test(asset))) {
            history[asset] = { time: now };
        }
    }

    let existingAssets = [];
    try {
        fs.accessSync(oldAssetsPath);
        existingAssets = fs.readdirSync(oldAssetsPath);
    } catch(e) {}
    
    for (asset of existingAssets) {
        let assetPath = path.resolve(newAssetsPath, asset);
        // Check if old assets don't name-conflict and are less than six months old
        if (history[asset] && !fs.existsSync(assetPath) && (now - history[asset].time < 15768000)) {
            fs.writeFileSync(assetPath, fs.readFileSync(path.resolve(oldAssetsPath, asset)));
        }
    }

    fs.writeFileSync(newHistoryPath, JSON.stringify(history));
    shell.rm('-rf', 'current_build');
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