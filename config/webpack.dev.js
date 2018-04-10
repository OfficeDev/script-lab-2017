const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = () =>
  webpackMerge(commonConfig(false), {
    devtool: 'inline-source-map',
    mode: 'development',
    resolve: {
      modules: ["node_modules"]
    },

    module: {
      rules: [
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: ['css-loader', 'postcss-loader', 'sass-loader']
          }),
          exclude: /theme/
        }
      ]
    },

    devServer: {
      publicPath: "/",
      contentBase: path.resolve('./dist/client'),
      https: true,
      overlay: {
        warnings: false,
        errors: true
      },
      port: 3000,
      quiet: true,
      historyApiFallback: true,
      stats: {
        assets: false,
        cached: false,
        children: false,
        chunks: true,
        chunkModules: true,
        chunkOrigins: false,
        context: "./dist/client/",
        colors: true,
        errors: true,
        errorDetails: true,
        hash: true,
        modules: false,
        modulesSort: "field",
        publicPath: true,
        reasons: false,
        source: false,
        timings: true,
        version: true,
        warnings: true
      }
    }
  });
