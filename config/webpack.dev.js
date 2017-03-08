var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var path = require('path');
var { build, config } = require('./env.config');

module.exports = webpackMerge(commonConfig, {
    devtool: 'inline-source-map',

    output: {
        path: path.resolve('./dist/client'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
        publicPath: 'https://localhost:3000'
    },

    plugins: [
        new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} © ${build.author}` }),
        new ExtractTextPlugin('[name].bundle.css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: true,
                build: build,
                config: config
            })
        }),
        new BrowserSyncPlugin(
            {
                https: true,
                host: 'localhost',
                port: 3000,
                proxy: 'https://localhost:3100/'
            },
            {
                reload: false
            }
        )
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
        watchContentBase: true,
        compress: true,
        port: 3100,
        historyApiFallback: true,
        noInfo: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
});
