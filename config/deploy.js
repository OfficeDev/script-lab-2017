#!/usr/bin/env node --harmony
var path = require('path');
var fs = require('fs-extra');
var chalk = require('chalk');
var _ = require('lodash');
var _a = require('./env.config'), build = _a.build, config = _a.config;
var shell = require('shelljs');
var webpackConfig = require('./webpack.prod');
var webpack = require('webpack');
var _b = process.env, TRAVIS = _b.TRAVIS, TRAVIS_BRANCH = _b.TRAVIS_BRANCH, TRAVIS_PULL_REQUEST = _b.TRAVIS_PULL_REQUEST, AZURE_WA_USERNAME = _b.AZURE_WA_USERNAME, AZURE_WA_SITE = _b.AZURE_WA_SITE, AZURE_WA_PASSWORD = _b.AZURE_WA_PASSWORD;
var TRAVIS_COMMIT_MESSAGE_SANITIZED = process.env['TRAVIS_COMMIT_MESSAGE'].replace(/\W/g, '_');
var DAYS_TO_KEEP_HISTORY = 90;
process.env.NODE_ENV = process.env.ENV = 'production';
try {
    precheck();
    /* If running inside of a pull request then skip deploy */
    if (TRAVIS_PULL_REQUEST !== 'false') {
        exit('Skipping deploy for pull requests');
    }
    /* Check if the branch name is valid. */
    var slot = _.isString(TRAVIS_BRANCH) && _.kebabCase(TRAVIS_BRANCH);
    if (slot == null) {
        exit('Invalid branch name. Skipping deploy.', true);
    }
    var buildConfig = void 0;
    switch (slot) {
        case 'master':
            buildConfig = config.edge;
            slot = 'edge';
            break;
        case 'insiders':
            buildConfig = config.insiders;
            slot = 'insiders';
            break;
        case 'production':
            buildConfig = config.production;
            slot = 'staging';
            break;
        default:
            buildConfig = null;
            exit('No deployment configuration found for ' + slot + '. Skipping deploy.');
    }
    var EDITOR_SITE_URL_1 = 'https://' + AZURE_WA_SITE + '-' + slot + '.azurewebsites.net';
    var EDITOR_UsernamePassword_URL = 'https://'
        + AZURE_WA_USERNAME + ':'
        + AZURE_WA_PASSWORD + '@'
        + AZURE_WA_SITE
        + '-' + slot
        + '.scm.azurewebsites.net:443/'
        + AZURE_WA_SITE + '.git';
    var RUNNER_UsernamePassword_URL = 'https://'
        + AZURE_WA_USERNAME + ':'
        + AZURE_WA_PASSWORD + '@'
        + AZURE_WA_SITE + '-runner'
        + '-' + slot
        + '.scm.azurewebsites.net:443/'
        + AZURE_WA_SITE + '-runner.git';
    // For production, changes are first deployed to staging environment which gets manually swapped into real production.
    // However, sometimes builds can also be rolled back!  To avoid issues with caching (and some files going missing)
    // we always want to copy existing bundle resources from both locations
    var additionalResourcesCopyFromUrl = void 0;
    if (slot === 'staging') {
        additionalResourcesCopyFromUrl = {
            friendlyName: "Production site directly (not the slot)",
            urlWithUsernameAndPassword: 'https://'
                + AZURE_WA_USERNAME + ':'
                + AZURE_WA_PASSWORD + '@'
                + AZURE_WA_SITE
                + '.scm.azurewebsites.net:443/'
                + AZURE_WA_SITE + '.git'
        };
    }
    log('Deploying commit: "' + TRAVIS_COMMIT_MESSAGE_SANITIZED + '" to ' + AZURE_WA_SITE + '-' + slot + '...');
    deployBuild(EDITOR_UsernamePassword_URL, 'dist/client', [
        { friendlyName: EDITOR_SITE_URL_1, urlWithUsernameAndPassword: EDITOR_UsernamePassword_URL },
        additionalResourcesCopyFromUrl
    ]);
    deployBuild(RUNNER_UsernamePassword_URL, 'dist/server', null);
    function precheck() {
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
    function deployBuild(urlWithUsernameAndPassword, folder, copyDeployedResourcesUrls) {
        try {
            var current_path = path.resolve();
            var next_path_1 = path.resolve(folder);
            shell.cd(next_path_1);
            var start = Date.now();
            if (copyDeployedResourcesUrls) {
                var historyPath = path.resolve(next_path_1, 'history.json');
                console.log('History before:');
                printHistoryDetailsIfAvailable(historyPath);
                console.log('\n\n' + 'Now will copy the existing resources...' + '\n\n');
                copyDeployedResourcesUrls
                    .filter(function (item) { return !_.isNil(item); })
                    .forEach(function (copyInfo) { return buildAssetAndLibHistory(copyInfo, next_path_1); });
                console.log('The appended history is now:');
                printHistoryDetailsIfAvailable(historyPath);
                console.log('\n\n\n\n');
                var appendedHistory = JSON.parse(fs.readFileSync(historyPath).toString());
                var newHistory = {};
                var now = (new Date().getTime()) / 1000;
                for (var key in appendedHistory) {
                    var age = (now - appendedHistory[key].time) / 24 / 60 / 60;
                    if (age < DAYS_TO_KEEP_HISTORY) {
                        newHistory[key] = appendedHistory[key];
                    }
                }
                fs.writeFileSync(historyPath, JSON.stringify(newHistory));
                console.log('Trimming out old entries, we get:');
                printHistoryDetailsIfAvailable(historyPath);
                console.log('\n\n\n\n');
            }
            shell.exec('git init');
            shell.exec('git config --add user.name "Travis CI"');
            shell.exec('git config --add user.email "travis.ci@microsoft.com"');
            var result = shell.exec('git add -A');
            if (result.code !== 0) {
                shell.echo(result.stderr);
                exit('An error occurred while adding files...', true);
            }
            result = shell.exec('git commit -m "' + TRAVIS_COMMIT_MESSAGE_SANITIZED + '"');
            if (result.code !== 0) {
                shell.echo(result.stderr);
                exit('An error occurred while committing files...', true);
            }
            log('Pushing ' + folder + ' to ' + EDITOR_SITE_URL_1 + '... Please wait...');
            result = shell.exec('git push ' + urlWithUsernameAndPassword + ' -q -f -u HEAD:refs/heads/master', { silent: true });
            if (result.code !== 0) {
                exit('An error occurred while deploying ' + folder + ' to ' + EDITOR_SITE_URL_1 + '...', true);
            }
            var end = Date.now();
            log('Successfully deployed in ' + (end - start) / 1000 + ' seconds.', 'green');
            shell.cd(current_path);
        }
        catch (error) {
            log('Deployment failed...', 'red');
            console.log(error);
        }
    }
    function buildAssetAndLibHistory(source, folder) {
        log('Copying existing assets from ' + source.friendlyName);
        shell.exec('git clone ' + source.urlWithUsernameAndPassword + ' existing_build', { silent: true });
        shell.cp('-n', ['existing_build/*.js', 'existing_build/*.css'], '.');
        var oldLibsPath = path.resolve(folder, 'existing_build/libs');
        var newLibsPath = path.resolve(folder, 'libs');
        for (var _i = 0, _a = fs.readdirSync(oldLibsPath); _i < _a.length; _i++) {
            var asset = _a[_i];
            var libPath = path.resolve(newLibsPath, asset);
            // Check if old assets don't name-conflict
            if (fs.existsSync(libPath)) {
                console.log("The library \"" + asset + "\" is already in current build, so skipping copying it from a previous build");
            }
            else {
                console.log("Copying \"" + asset + "\" from a previous build into the current \"libs\" folder");
                fs.copySync(path.resolve(oldLibsPath, asset), libPath);
            }
        }
        // Note: dividing by 1000 to go from JS dates to UNIX epoch dates
        var now = (new Date().getTime()) / 1000;
        var oldHistoryPath = path.resolve(folder, 'existing_build/history.json');
        var newHistoryPath = path.resolve(folder, 'history.json');
        var oldAssetsPath = path.resolve(folder, 'existing_build/bundles');
        var newAssetsPath = path.resolve(folder, 'bundles');
        var history = {};
        if (fs.existsSync(newHistoryPath)) {
            log("The new history path (\"" + newHistoryPath + "\") already exists, re-using it");
            history = JSON.parse(fs.readFileSync(newHistoryPath).toString());
        }
        if (fs.existsSync(oldHistoryPath)) {
            // Parse old history file if it exists
            log('History of existing build:');
            printHistoryDetailsIfAvailable(oldHistoryPath);
            log('\n\n');
            var oldHistory = JSON.parse(fs.readFileSync(oldHistoryPath).toString());
            for (var key in oldHistory) {
                history[key] = oldHistory[key];
            }
        }
        // Add new asset files to history, with current timestamp; exclude chunk files
        var newAssets = fs.readdirSync(newAssetsPath);
        for (var _b = 0, newAssets_1 = newAssets; _b < newAssets_1.length; _b++) {
            var asset = newAssets_1[_b];
            if (!(/chunk.js/i.test(asset))) {
                history[asset] = { time: now };
            }
        }
        var existingAssets = fs.readdirSync(oldAssetsPath);
        for (var _c = 0, existingAssets_1 = existingAssets; _c < existingAssets_1.length; _c++) {
            var asset = existingAssets_1[_c];
            var assetPath = path.resolve(newAssetsPath, asset);
            // Check if old assets don't name-conflict and are still young enough to keep
            if (history[asset] && !fs.existsSync(assetPath) && (now - history[asset].time < (60 * 60 * 24 * DAYS_TO_KEEP_HISTORY))) {
                fs.writeFileSync(assetPath, fs.readFileSync(path.resolve(oldAssetsPath, asset)));
            }
        }
        fs.writeFileSync(newHistoryPath, JSON.stringify(history));
        shell.rm('-rf', 'existing_build');
    }
    function printHistoryDetailsIfAvailable(filename) {
        if (!fs.existsSync(filename)) {
            log("    Cannot print history, file \"" + filename + "\" doesn't exist.");
            return;
        }
        var logData = JSON.parse(fs.readFileSync(filename).toString());
        var grouped = {};
        for (var key in logData) {
            var regex = /^([^\.]+)\.([a-f0-9]{20})\.(.*)/;
            var regexParse = regex.exec(key);
            if (!regexParse) {
                throw new Error(key + " doesn't match expected hash pattern");
            }
            var nohash = regexParse[1] + "." + regexParse[3];
            var correspondingGroup = grouped[nohash];
            if (!correspondingGroup) {
                correspondingGroup = {};
                grouped[nohash] = correspondingGroup;
            }
            var time = logData[key].time;
            // Note: dividing by 1000 to go from JS dates to UNIX epoch dates
            var now = (new Date().getTime()) / 1000;
            var age = Math.round((now - time) / 24 / 60 / 60 * 100) / 100;
            correspondingGroup[key] = { key: nohash, filename: key, time: time, age: age };
        }
        var outerArray = [];
        for (var key in grouped) {
            var innerArray = [];
            for (var innerKey in grouped[key]) {
                innerArray.push(grouped[key][innerKey]);
            }
            innerArray.sort(function (a, b) { return b.time - a.time; }); // reverse-chronological
            outerArray.push(innerArray);
        }
        outerArray.sort(function (a, b) { return compareStrings(a[0].key, b[0].key); });
        outerArray.forEach(function (group) {
            log('    ' + group[0].key);
            group.forEach(function (item) {
                var isRecent = item.age < DAYS_TO_KEEP_HISTORY;
                log('        ' + item.filename);
                log('            ' + new Date(item.time * 1000).toISOString() + ')', isRecent ? 'green' : 'red');
            });
        });
        // Helper
        function compareStrings(a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            return (a < b) ? -1 : (a > b) ? 1 : 0;
        }
    }
}
catch (e) {
    log('An error occured, aborting');
    log(e, 'red');
    exit('Quitting', true /*abort*/);
}
// Helpers:
function log(message, color) {
    console.log(chalk.bold[color || 'cyan'](message));
}
function exit(reason, abort) {
    if (reason) {
        abort ? console.log(chalk.bold.red(reason)) : console.log(chalk.bold.yellow(reason));
    }
    return abort ? process.exit(1) : process.exit(0);
}
