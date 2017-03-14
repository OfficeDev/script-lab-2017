var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var commonConfig = require('./webpack.common.js');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var path = require('path');
var { build, config } = require('./env.config');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const { TRAVIS } = process.env;

module.exports = webpackMerge(commonConfig, {
    devtool: 'source-map',

    output: {
        path: './dist/client',
        filename: '[name].bundle.js',
        chunkFilename: '[id].chunk.js'
    },

    performance: {
        hints: "warning"
    },

    stats: {
        // Add asset Information
        assets: false,
        // Add information about cached (not built) modules
        cached: false,
        // Add children information
        children: false,
        // Add chunk information (setting this to `false` allows for a less verbose output)
        chunks: true,
        // Add built modules information to chunk information
        chunkModules: true,
        // Add the origins of chunks and chunk merging info
        chunkOrigins: false,
        // Sort the chunks by a field
        context: "./dist/client/",
        // `webpack --colors` equivalent
        colors: true,
        // Add errors
        errors: true,
        // Add details to errors (like resolving log)
        errorDetails: true,
        // Add the hash of the compilation
        hash: true,
        // Add built modules information
        modules: false,
        // Sort the modules by a field
        modulesSort: "field",
        // Add public path information
        publicPath: true,
        // Add information about the reasons why modules are included
        reasons: false,
        // Add the source code of modules
        source: false,
        // Add timing information
        timings: true,
        // Add webpack version information
        version: true,
        // Add warnings
        warnings: false
    },

    plugins: [
        new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} © ${build.author}` }),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: true,
            mangle: {
                keep_fnames: true
            }
        }),
        new webpack.DefinePlugin({
            PLAYGROUND: JSON.stringify({
                devMode: false,
                build: build,
                config: config
            })
        })
    ]
});
