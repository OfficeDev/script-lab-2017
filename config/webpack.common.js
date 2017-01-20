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
        timestamp: timestamp,
        author: 'Microsoft'
    };
})();

var config = (function (env) {
    return {
        dev: {
            client_id: '95435036e70d23b8549f',
            instrumentation_key: '8cc167c3-cd53-49f5-8b5c-bf8bccdb8995',
            token_url: 'https://addin-playground-runner.azurewebsites.net/auth/dev'
        },
        prod: {
            client_id: '8d19e9bbcea2a1cee274',
            instrumentation_key: '8e23f709-f4ee-4b7d-9a47-2d57224885ce',
            token_url: 'https://addin-playground-runner.azurewebsites.net/auth/prod'
        },
        cdn: {
            client_id: 'b05714a22e602446c43a',
            instrumentation_key: '8e23f709-f4ee-4b7d-9a47-2d57224885ce',
            token_url: 'https://addin-playground-runner.azurewebsites.net/auth/cdn'
        }
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
    auth: config,

    postcss: function () {
        return [autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }), perfectionist];
    },

    plugins: [
        new CheckerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['polyfills', 'vendor', 'app'].reverse()
        }),
        new webpack.BannerPlugin(`v.${meta.name} ${meta.version} © ${meta.author}`),
        new CopyWebpackPlugin([
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
            }
        ]),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
};