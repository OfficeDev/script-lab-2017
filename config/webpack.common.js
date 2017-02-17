var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var {CheckerPlugin} = require('awesome-typescript-loader');
var autoprefixer = require('autoprefixer');
var perfectionist = require('perfectionist');
var {build, config, whilelistPlugins} = require('./env.config');

var buildInfo = build();

module.exports = {
    entry: {
        'polyfills': './src/editor/polyfills.ts',
        'vendor': './src/editor/vendor.ts',
        'app': './src/editor/app.module.ts',
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

    postcss: function () {
        return [autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }), perfectionist];
    },

    build: buildInfo,
    config: config(),

    plugins: [
        new CheckerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['polyfills', 'vendor', 'app'].reverse()
        }),
        new webpack.BannerPlugin(`v.${buildInfo.name} ${buildInfo.version} © ${buildInfo.author}`),
        new CopyWebpackPlugin([
            {
                from: './src/editor/assets',
                ignore: ['*.scss'],
                to: 'assets'
            },
            {
                from: './src/editor/extras',
                to: ''
            },
            {
                from: 'node_modules/monaco-editor/min',
                to: 'libs/monaco-editor'
            },
            {
                from: 'node_modules/office-ui-fabric-js/dist/css',
                to: 'libs/office-ui-fabric-js/css'
            },
            {
                from: 'node_modules/office-ui-fabric-js/dist/js',
                to: 'libs/office-ui-fabric-js/js'
            },
        ]),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/editor/index.html',
            chunks: ['polyfills', 'vendor', 'app']
        }),
        new HtmlWebpackPlugin({
            filename: 'functions.html',
            template: './src/editor/functions.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            filename: 'gallery.html',
            template: './src/editor/gallery.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            filename: 'heartbeat.html',
            template: './src/editor/heartbeat.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            filename: 'refresh.html',
            template: './src/editor/refresh.html',
            chunks: [],
        })
    ]
};
