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
                from: './src/assets',
                ignore: ['*.scss'],
                to: 'assets'
            },
            {
                from: './src/extras',
                to: ''
            },
            {
                from: 'node_modules/monaco-editor/min',
                to: 'libs/monaco-editor'
            },
            {
                from: 'node_modules/office-ui-fabric-js/dist',
                to: 'libs/office-ui-fabric-js'
            },
        ]),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            chunks: ['polyfills', 'vendor', 'app']
        }),
        new HtmlWebpackPlugin({
            template: 'src/functions.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            template: 'src/gallery.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            template: 'src/heartbeat.html',
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            template: 'src/refresh.html',
            chunks: [],
        })
    ]
};
