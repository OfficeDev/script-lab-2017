var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var path = require('path');
var { build, config } = require('./env.config');

module.exports = webpackMerge(commonConfig, {
    devtool: 'inline-source-map',

    output: {
        path: path.resolve('./dist/client'),
        filename: '[name].[hash].js',
        chunkFilename: '[name].[hash].chunk.js'
    },

    performance: {
        hints: "warning"
    },

    plugins: [
        new webpack.BannerPlugin({ banner: `v.${build.name} ${build.version} © ${build.author}` }),
        new ExtractTextPlugin('[name].[hash].css'),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: true,
                build: commonConfig.build,
                config: commonConfig.config
            })
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static'
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
            warnings: true,
            errors: true
        },
        watchContentBase: true,
        compress: true,
        port: 3100,
        historyApiFallback: true,
        stats: 'minimal',
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
});
