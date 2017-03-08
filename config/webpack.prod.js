var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var path = require('path');
var chalk = require('chalk');
var { build, config } = require('./env.config');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map',

    output: {
        path: path.resolve('dist'),
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },

    performance: {
        hints: "warning"
    },

    htmlLoader: {
        minimize: false
    },

    plugins: [
        new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} © ${build.author}` }),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: true,
            mangle: {
                keep_fnames: true
            }
        }),
        new BundleAnalyzerPlugin(),
        new ExtractTextPlugin('[name].css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: false,
                build: build,
                config: config
            })
        })
    ]
});
