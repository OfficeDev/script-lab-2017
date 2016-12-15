var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var path = require('path');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map',

    output: {
        path: path.resolve('dist'),
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },

    htmlLoader: {
        minimize: false // workaround for ng2
    },

    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: {
                keep_fnames: true
            }
        }),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/monaco-editor',
                to: 'monaco-editor'
            },
        ]),
        new ExtractTextPlugin('[name].css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                ENV: 'PRODUCTION',
                INFO: commonConfig.meta,
                constants: {
                    GITHUB_TOKEN_SERVICE_URL: "https://addin-playground-runner.azurewebsites.net/auth/prod",
                    GITHUB_AUTH_CLIENT_ID: "cce40da3a21f60a352b8df3686b47cadd536cbe4"
                }
            })
        })
    ]
});
