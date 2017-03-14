var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
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
    },

    plugins: [
        new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} © ${build.author}` }),
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
        quiet: true,
        stats: {
            // Add asset Information
            assets: false,
            // Add information about cached (not built) modules
            cached: false,
            // Add children information
            children: false,
            // Add chunk information (setting this to `false` allows for a less verbose output)
            chunks: true,
            // Add built modules information to chunk information
            chunkModules: true,
            // Add the origins of chunks and chunk merging info
            chunkOrigins: false,
            // Sort the chunks by a field
            context: "./dist/client/",
            // `webpack --colors` equivalent
            colors: true,
            // Add errors
            errors: true,
            // Add details to errors (like resolving log)
            errorDetails: true,
            // Add the hash of the compilation
            hash: true,
            // Add built modules information
            modules: false,
            // Sort the modules by a field
            modulesSort: "field",
            // Add public path information
            publicPath: true,
            // Add information about the reasons why modules are included
            reasons: false,
            // Add the source code of modules
            source: false,
            // Add timing information
            timings: true,
            // Add webpack version information
            version: true,
            // Add warnings
            warnings: false
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
});
