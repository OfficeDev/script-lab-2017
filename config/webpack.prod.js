const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const { TRAVIS } = process.env;

module.exports = (env) =>
  webpackMerge(commonConfig(true), {
    devtool: 'source-map',
    mode: 'production',

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

    performance: {
      hints: "warning"
    },

    stats: {
      assets: true,
      cached: false,
      children: false,
      chunks: true,
      chunkModules: true,
      chunkOrigins: false,
      context: path.resolve("./dist/client/"),
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
      warnings: false
    }
  });
