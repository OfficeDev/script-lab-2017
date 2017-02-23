var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var path = require('path');
var chalk = require('chalk');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

var config = webpackMerge(commonConfig, {
    devtool: 'source-map',

    output: {
        path: path.resolve('dist'),
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },

    htmlLoader: {
        minimize: false
    },

    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {
                keep_fnames: true
            }
        }),
        new ExtractTextPlugin('[name].css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: false,
                build: commonConfig.build,
                config: commonConfig.config
            })
        })
    ]
});


const start = Date.now();
webpack(config, function (err, stats) {
    stats.chunks = false;
    stats.hash = true;
    stats.version = true;
    stats.modules = true;

    if (err) {
        console.log(chalk.bold.red(err));
        process.exit(1);
    }

    if (stats.hasErrors()) {
        let json = stats.toJson();
        console.log(chalk.bold.red(json.errors));
        process.exit(1);
    }

    const end = Date.now();
    console.log(chalk.bold.green('\n\nGenerated build #' + config.build.timestamp + ' in ' + (end - start) / 1000 + ' seconds'));
    console.log(chalk.bold.magenta(config.build.name + ' - v' + config.build.version + '\n\n'));
});
