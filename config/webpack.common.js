var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var {CheckerPlugin} = require('awesome-typescript-loader');
var autoprefixer = require('autoprefixer');
var perfectionist = require('perfectionist');
var {build, config, whilelistPlugins} = require('./env.config');

module.exports = {
    entry: {
        'polyfills': './client/polyfills.ts',
        'vendor': './client/vendor.ts',
        'main': './client/main.ts',
        'functions': './client/public/functions.ts',
        'gallery': './client/public/gallery.ts',
        'heartbeat': './client/public/heartbeat.ts',
        'refresh': './client/public/refresh.ts'
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

    build: build,
    config: config,

    plugins: [
        new CheckerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['polyfills', 'vendor', 'app'].reverse()
        }),
        new webpack.BannerPlugin(`v.${build.name} ${build.version} © ${build.author}`),
        new CopyWebpackPlugin([
            {
                from: './client/assets',
                ignore: ['*.scss'],
                to: 'assets'
            },
            {
                from: './client/public',
                to: '',
                ignore: ['*.ts']
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
            template: './client/views/index.html',
            chunks: ['polyfills', 'vendor', 'app']
        }),
        new HtmlWebpackPlugin({
            filename: 'functions.html',
            template: './client/views/functions.html',
            chunks: ['polyfills', 'vendor', 'functions'],
        }),
        new HtmlWebpackPlugin({
            filename: 'gallery.html',
            template: './client/views/gallery.html',
            chunks: ['polyfills', 'vendor', 'gallery'],
        }),
        new HtmlWebpackPlugin({
            filename: 'heartbeat.html',
            template: './client/views/heartbeat.html',
            chunks: ['polyfills', 'vendor', 'heartbeat'],
        }),
        new HtmlWebpackPlugin({
            filename: 'refresh.html',
            template: './client/views/refresh.html',
            chunks: ['polyfills', 'vendor', 'refresh'],
        })
    ]
};
