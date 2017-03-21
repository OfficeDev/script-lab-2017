var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var commonConfig = require('./webpack.common.js');
var path = require('path');

module.exports = webpackMerge(commonConfig, {
    devtool: 'cheap-eval-source-map',

    output: {
        path: path.resolve('./dist/client'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],

    devServer: {
        contentBase: path.resolve('./dist/client'),
        compress: true,
        https: true,
        inline: true,
        overlay: {
            warnings: false,
            errors: true
        },
        open: true,
        watchContentBase: true,
        compress: true,
        port: 3000,
        historyApiFallback: true,
        quiet: true,
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
            warnings: false
        }
    }
});
