const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const path = require('path');

module.exports = (env) => 
    webpackMerge(commonConfig(env.mode === 'prod'), {
        devtool: '#source-map',

        output: {
            path: path.resolve('./dist/client'),
            filename: '[name].bundle.js',
            chunkFilename: '[name].chunk.js',
        },

        resolve: {
            modules: ["node_modules"]
        },

        devServer: {
            publicPath: "/",
            contentBase: path.resolve('./dist/client'),
            https: true,
            overlay: {
                warnings: false,
                errors: true
            },
            open: true,
            port: 3000,
            hot: true,
            quiet: true,
            historyApiFallback: true,
            stats: {
                assets: false,
                cached: false,
                children: false,
                chunks: true,
                chunkModules: true,
                chunkOrigins: false,
                context: "./dist/client/",
                colors: true,
                errors: true,
                errorDetails: true,
                hash: true,
                modules: false,
                modulesSort: "field",
                publicPath: true,
                reasons: false,
                source: false,
                timings: true,
                version: true,
                warnings: true
            }
        }
    });
