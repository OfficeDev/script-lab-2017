let webpack = require('webpack');
let path = require('path');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let { CheckerPlugin } = require('awesome-typescript-loader');
let autoprefixer = require('autoprefixer');
let perfectionist = require('perfectionist');

const { build, config } = require('./env.config');
const { GH_SECRETS, ENV } = process.env;
const isDev = ENV !== 'production';

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
                    'awesome-typescript-loader?{configFileName: "tsconfig.webpack.json"}'
                ].concat(isDev? '@angularclass/hmr-loader':''),
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
            {
                from: '../../node_modules/monaco-editor/min',
                to: './libs/monaco-editor'
            },
            {
                from: '../../node_modules/office-ui-fabric-js/dist/css',
                to: './libs/office-ui-fabric-js/css'
            },
            {
                from: '../../node_modules/office-ui-fabric-js/dist/js',
                to: './libs/office-ui-fabric-js/js'
            }
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
