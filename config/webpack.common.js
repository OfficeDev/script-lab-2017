var webpack = require('webpack');
var path = require('path');
var package = require('../package.json');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var {CheckerPlugin} = require('awesome-typescript-loader');
var autoprefixer = require('autoprefixer');
var perfectionist = require('perfectionist');

var meta = (function () {
    var timestamp = new Date().getTime();

    return {
        name: 'Add-in Playground',
        version: package.version,
        build: timestamp,
        author: 'Microsoft',
        full_version: `${package.version}.${timestamp}`
    };
})();

module.exports = {
    entry: {
        'polyfills': './src/polyfills.ts',
        'vendor': './src/vendor.ts',
        'app': './src/app.module.ts',
    },

    resolve: {
        extensions: ['', '.js', '.ts', '.scss', '.css', '.html']
    },

    module: {
        loaders: [
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.ts$/,
                loaders: ['awesome-typescript-loader', 'angular2-template-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('css!postcss!sass'),
                exclude: /theme/
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file?name=assets/[name].[ext]'
            }
        ]
    },

    meta: meta,

    postcss: function () {
        return [autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }), perfectionist];
    },

    plugins: [
        new CheckerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['polyfills', 'vendor', 'app'].reverse()
        }),
        new webpack.BannerPlugin(`v.${meta.name} ${meta.full_version} © ${meta.author}`),
        new CopyWebpackPlugin([
            {
                from: 'src/acquire.html',
                to: 'acquire.html'
            },
            {
                from: './src/assets',
                ignore: [
                    '*.scss'
                ],
                to: 'assets',
            },
            {
                from: './web.config',
                to: 'web.config',
            },
            {
                from: './config/env.json',
                to: 'env.json',
            }
        ]),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
};