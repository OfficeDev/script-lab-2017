let webpack = require('webpack');
let webpackMerge = require('webpack-merge');
let commonConfig = require('./webpack.common.js');
let path = require('path');
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const { TRAVIS } = process.env;

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map',

    output: {
        path: './dist/client',
        filename: '[name].bundle.js',
        chunkFilename: '[id].chunk.js'
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
        warnings: false
    },

    plugins: [
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
