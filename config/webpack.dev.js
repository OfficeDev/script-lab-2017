let webpack = require('webpack');
let webpackMerge = require('webpack-merge');
let commonConfig = require('./webpack.common.js');
let path = require('path');

module.exports = webpackMerge(commonConfig, {
    devtool: '#source-map',

    output: {
        path: path.resolve('./dist/client'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
    },

    resolve: {
        modules: ["node_modules"]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],

    devServer: {
        publicPath: "/",
        contentBase: path.resolve('./dist/client'),
        https: true,
        inline: false,
        overlay: {
            warnings: false,
            errors: true
        },
        open: true,
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
