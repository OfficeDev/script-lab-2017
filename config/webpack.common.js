var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var { CheckerPlugin } = require('awesome-typescript-loader');
var autoprefixer = require('autoprefixer');
var perfectionist = require('perfectionist');

module.exports = {
    context: path.resolve('./client'),

    entry: {
        polyfills: './polyfills.ts',
        vendor: './vendor.ts',
        main: './main.ts',
        functions: './public/functions.ts',
        gallery: './public/gallery.ts',
        heartbeat: './public/heartbeat.ts',
        refresh: './public/refresh.ts'
    },

    resolve: {
        extensions: ['.js', '.ts', '.scss', '.css', '.html']
    },

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                use: "source-map-loader"
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /\.ts$/,
                use: [
                    'awesome-typescript-loader',
                    'angular2-template-loader'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [
                                    autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }),
                                    perfectionist
                                ]
                            }
                        },
                        'sass-loader'
                    ]
                }),
                exclude: /theme/
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [
                        {
                            loader: 'file-loader',
                            query: {
                                name: 'assets/[name].[ext]'
                            }
                        },
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [
                                    autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }),
                                    perfectionist
                                ]
                            }
                        },
                        'sass-loader'
                    ]
                }),
                include: /themes/
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                use: {
                    loader: 'file-loader',
                    query: {
                        name: 'assets/[name].[ext]'
                    }
                }
            }
        ]
    },

    plugins: [
        new CheckerPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['polyfills', 'vendor', 'main'].reverse(),
            minChunks: 2
        }),
        new CopyWebpackPlugin([
            {
                from: './assets',
                ignore: ['*.scss'],
                to: 'assets'
            },
            {
                from: './public',
                to: '',
                ignore: ['*.ts']
            },
            {
                from: '../node_modules/monaco-editor/min',
                to: './libs/monaco-editor'
            },
            {
                from: '../node_modules/office-ui-fabric-js/dist/css',
                to: './libs/office-ui-fabric-js/css'
            },
            {
                from: '../node_modules/office-ui-fabric-js/dist/js',
                to: './libs/office-ui-fabric-js/js'
            },
        ]),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './views/index.html',
            chunks: ['polyfills', 'vendor', 'main']
        }),
        new HtmlWebpackPlugin({
            filename: 'functions.html',
            template: './views/functions.html',
            chunks: ['polyfills', 'vendor', 'functions'],
        }),
        new HtmlWebpackPlugin({
            filename: 'gallery.html',
            template: './views/gallery.html',
            chunks: ['polyfills', 'vendor', 'gallery'],
        }),
        new HtmlWebpackPlugin({
            filename: 'heartbeat.html',
            template: './views/heartbeat.html',
            chunks: ['polyfills', 'vendor', 'heartbeat'],
        }),
        new HtmlWebpackPlugin({
            filename: 'refresh.html',
            template: './views/refresh.html',
            chunks: ['polyfills', 'vendor', 'refresh'],
        })
    ]
};
