const webpack = require('webpack');
const path = require('path');
const AssetsWebpackPlugin = require('assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const autoprefixer = require('autoprefixer');
const perfectionist = require('perfectionist');
const { build, config, RedirectPlugin, PLAYGROUND_ORIGIN, PLAYGROUND_REDIRECT } = require('./env.config');
const { GH_SECRETS } = process.env;

module.exports = (prodMode) =>
    ({
        context: path.resolve('./src/client'),

        entry: {
            indexScript: './public/index.script.ts',
            runScript: './public/run.script.ts',
            tutorialScript: './public/tutorial.script.ts',

            polyfills: './polyfills.ts',
            vendor: './vendor.ts',
            main: './main.ts',
            functions: './public/functions.ts',
            gallery: './public/gallery.ts',
            heartbeat: './public/heartbeat.ts',
            runner: './public/runner.ts',
            error: './public/error.ts',
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
                    use: 'awesome-typescript-loader?configFileName=tsconfig.webpack.json',
                    exclude: /node_modules/
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
            new webpack.NoEmitOnErrorsPlugin(),
            new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} (${prodMode ? 'PROD' : 'DEV'}:${build.timestamp}) © ${build.author}` }),
            new webpack.DefinePlugin({
                PLAYGROUND: JSON.stringify({
                    devMode: !prodMode,
                    build: build,
                    config: config,
                    PLAYGROUND_ORIGIN: PLAYGROUND_ORIGIN,
                    PLAYGROUND_REDIRECT: PLAYGROUND_REDIRECT
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
            new AssetsWebpackPlugin({
                filename: 'assets.json',
                path: path.resolve('./dist/server')
            }),
            new CheckerPlugin(),
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
                    from: './views/external-page.html',
                    to: 'external-page.html',
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
                chunks: ['indexScript', 'polyfills', 'vendor', 'main']
            }),
            new HtmlWebpackPlugin({
                filename: 'functions.html',
                template: './views/functions.html',
                chunks: ['polyfills', 'vendor', 'functions'],
            }),
            new HtmlWebpackPlugin({
                filename: 'run.html',
                template: './views/run.html',
                chunks: ['runScript', 'polyfills', 'vendor', 'gallery'],
            }),
            new HtmlWebpackPlugin({
                filename: 'heartbeat.html',
                template: './views/heartbeat.html',
                chunks: ['polyfills', 'vendor', 'heartbeat'],
            }),
            new HtmlWebpackPlugin({
                filename: 'tutorial.html',
                template: './views/tutorial.html',
                chunks: ['polyfills', 'vendor', 'tutorialScript'],
            }),
            new HtmlWebpackPlugin({
                filename: 'test-view-iframe.html',
                template: './views/test-view-iframe.html'
            }),
            new RedirectPlugin()
        ]
    });
