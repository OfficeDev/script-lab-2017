const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const AssetsWebpackPlugin = require('assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const autoprefixer = require('autoprefixer');
const perfectionist = require('perfectionist');
const { build, config, RedirectPlugin,
    localStorageKeys, sessionStorageKeys,
    safeExternalUrls, experimentationFlagsDefaults } = require('./env.config');
const { getVersionedPackageNames,
    VersionedPackageSubstitutionsPlugin } = require('./package.version.substitutions.plugin.js');
const { GH_SECRETS } = process.env;

const versionedPackageNames = getVersionedPackageNames([
    'monaco-editor',
    '@microsoft/office-js',
    'office-ui-fabric-js',
    'jquery',
    'jquery-resizable-dom',
    'jsgrid',
]);

fs.writeFileSync(path.resolve('./dist/server/versionPackageNames.json'), JSON.stringify(versionedPackageNames));

module.exports = (prodMode) =>
    ({
        context: path.resolve('./src/client'),

        entry: {
            indexScript: './public/index.script.ts',
            runScript: './public/run.script.ts',
            tutorialScript: './public/tutorial.script.ts',
            externalPageScript: './public/external.page.script.ts',
            polyfills: './polyfills.ts',
            vendor: './vendor.ts',
            main: './main.ts',
            functions: './public/functions.ts',
            gallery: './public/gallery.ts',
            heartbeat: './public/heartbeat.ts',
            runner: './public/runner.ts',
            error: './public/error.ts',
            auth: './public/auth.ts',
            defaultAuth: './public/default-auth.ts',
            tryIt: './public/try.it.ts',
            customFunctions: './public/custom.functions.ts',
            customFunctionsHeartbeat: './public/custom.functions.heartbeat.ts',
            customFunctionsRegister: './public/custom.functions.register.ts',
            customFunctionsRunner: './public/custom.functions.runner.ts',
            customFunctionsDashboard: './public/custom.functions.dashboard.ts',
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
                    localStorageKeys: localStorageKeys,
                    sessionStorageKeys: sessionStorageKeys,
                    safeExternalUrls: safeExternalUrls,
                    experimentationFlagsDefaults: experimentationFlagsDefaults
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
                    to: './libs/' + versionedPackageNames['monaco-editor']
                },
                {
                    from: '../../node_modules/office-ui-fabric-js/dist/css',
                    to: './libs/' + versionedPackageNames['office-ui-fabric-js'] + '/css'
                },
                {
                    from: '../../node_modules/office-ui-fabric-js/dist/js',
                    to: './libs/' + versionedPackageNames['office-ui-fabric-js'] + '/js'
                },
                {
                    from: '../../node_modules/@microsoft/office-js/dist',
                    to: './libs/' + versionedPackageNames['@microsoft/office-js'] + '/dist'
                },
                {
                    from: '../../node_modules/jquery/dist',
                    to: './libs/' + versionedPackageNames['jquery']
                },
                {
                    from: '../../node_modules/jquery-resizable-dom/dist',
                    to: './libs/' + versionedPackageNames['jquery-resizable-dom']
                },
                {
                    from: '../../node_modules/jsgrid/dist',
                    to: './libs/' + versionedPackageNames['jsgrid']
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
                template: './views/empty.html',
                chunks: ['polyfills', 'vendor', 'heartbeat'],
            }),
            new HtmlWebpackPlugin({
                filename: 'custom-functions-dashboard.html',
                template: './views/custom-functions-dashboard.html',
                chunks: ['polyfills', 'vendor', 'customFunctionsDashboard'],
            }),
            new HtmlWebpackPlugin({
                filename: 'custom-functions.html',
                template: './views/empty.html',
                chunks: ['polyfills', 'vendor', 'customFunctions'],
            }),
            new HtmlWebpackPlugin({
                filename: 'custom-functions-heartbeat.html',
                template: './views/empty.html',
                chunks: ['polyfills', 'vendor', 'customFunctionsHeartbeat'],
            }),
            new HtmlWebpackPlugin({
                filename: 'tutorial.html',
                template: './views/tutorial.html',
                chunks: ['polyfills', 'vendor', 'tutorialScript'],
            }),
            new HtmlWebpackPlugin({
                filename: 'external-page.html',
                template: './views/external-page.html',
                chunks: ['polyfills', 'vendor', 'externalPageScript'],
            }),
            new HtmlWebpackPlugin({
                filename: 'default-auth.html',
                template: './views/default-auth.html',
                chunks: ['polyfills', 'vendor', 'defaultAuth'],
            }),

            new RedirectPlugin(),

            new VersionedPackageSubstitutionsPlugin(versionedPackageNames),

            new ExtractTextPlugin('bundles/[name].[chunkhash].bundle.css')
        ],

        output: {
            path: path.resolve('./dist/client'),
            filename: 'bundles/[name].[chunkhash].bundle.js',
            chunkFilename: 'bundles/[id].[chunkhash].chunk.js'
        }
    });
