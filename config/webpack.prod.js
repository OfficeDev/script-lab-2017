var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
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
        // new webpack.NoErrorsPlugin(),
        // new webpack.optimize.DedupePlugin(),
        // new webpack.optimize.UglifyJsPlugin({
        //     mangle: {
        //         keep_fnames: true
        //     }
        // }),
        new ExtractTextPlugin('[name].css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                ENV: 'PRODUCTION',
                INFO: commonConfig.meta,
                constants: {
                    "GITHUB_TOKEN_SERVICE_URL": "https://api-playground-auth.azurewebsites.net/api/GithubAuthProd?code=pp5eHDpaStza5JDyQXPzK4UcvYSEo4Q9A7fjUnwbxONYEluARYk/Jg==",
                    "GITHUB_AUTH_CLIENT_ID": "7cc4f025e87f951919e4"
                }
            })
        })
    ]
});
