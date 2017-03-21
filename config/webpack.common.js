var webpack = require('webpack');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var { CheckerPlugin } = require('awesome-typescript-loader');
var autoprefixer = require('autoprefixer');
var perfectionist = require('perfectionist');
var { build, config } = require('./env.config');
var { GH_SECRETS, ENV } = process.env;
var isDev = ENV !== 'production';

module.exports = {
    context: path.resolve('./src/client'),

    entry: {
        polyfills: './polyfills.ts',
        vendor: './vendor.ts',
        main: './main.ts',
        functions: './public/functions.ts',
        gallery: './public/gallery.ts',
        heartbeat: './public/heartbeat.ts',
        refresh: './public/refresh.ts',
        runner: './public/runner.ts'
    },

    resolve: {
        extensions: ['.js', '.ts', '.scss', '.css', '.html']
    },

    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /\.ts$/,
                use: [
                    '@angularclass/hmr-loader',
                    'awesome-typescript-loader?{configFileName: "tsconfig.webpack.json"}'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ['css-loader', 'postcss-loader', 'sass-loader']
                }),
                exclude: /theme/
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
        new webpack.NoErrorsPlugin(),
        new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} (${build.timestamp}) © ${build.author}` }),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: isDev,
                build: build,
                config: config
            })
        }),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: [
                    autoprefixer({ browsers: ['Safari >= 8', 'last 2 versions'] }),
                    perfectionist
                ],
                htmlLoader: {
                    minimize: false
                }
            }
        }),
        new CheckerPlugin(),
        new ExtractTextPlugin('[name].bundle.css'),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['vendor', 'polyfills'],
            minChunks: Infinity
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
                from: '../../config/env.config.js',
                to: '../server/core/env.config.js',
                transform: (content, path) => {
                    if (GH_SECRETS == null) {
                        return content;
                    }

                    const secrets = GH_SECRETS.split(',');
                    let mappedSecrets = {};
                    ['local', 'edge', 'insiders', 'production', 'cdn'].forEach((value, index) => {
                        mappedSecrets[value] = secrets[index];
                    });

                    const data = `\nexports.secrets = ${JSON.stringify(mappedSecrets)};`;
                    return content + data;
                }
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
            filename: 'run.html',
            template: './views/run.html',
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
