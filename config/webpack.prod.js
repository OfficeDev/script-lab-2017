const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const { TRAVIS } = process.env;

module.exports = (env) =>
    webpackMerge(commonConfig(env.mode === 'prod'), {
        devtool: 'source-map',

        output: {
            path: path.resolve('./dist/client'),
            filename: 'bundles/[name].[chunkhash].bundle.js',
            chunkFilename: 'bundles/[id].chunk.js'
        },

        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: ['css-loader', 'postcss-loader', 'sass-loader']
                    }),
                    exclude: /theme/
                }
            ]
        },

        performance: {
            hints: "warning"
        },

        stats: {
            assets: true,
            cached: false,
            children: false,
            chunks: true,
            chunkModules: true,
            chunkOrigins: false,
            context: path.resolve("./dist/client/"),
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
            warnings: false
        },

        plugins: [
            new ExtractTextPlugin('bundles/[name].[chunkhash].bundle.css'),
            new webpack.optimize.UglifyJsPlugin({
                sourceMap: true,
                compress: true,
                mangle: {
                    screw_ie8: true,
                    keep_fnames: true
                },
                compress: {
                    warnings: false,
                    screw_ie8: true
                },
                comments: false
            })
        ]
    });
