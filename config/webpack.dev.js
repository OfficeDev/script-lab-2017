const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = () => {
  const configParams = {
    prodMode: false,
    isLocalHost: true,
  };

  return webpackMerge(commonConfig(configParams), {
    devtool: 'inline-source-map',

    resolve: {
      modules: ['node_modules'],
    },

    module: {
      rules: [
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader'],
          }),
          exclude: /theme/,
        },
      ],
    },

    plugins: [
      new BrowserSyncPlugin(
        {
          https: true,
          host: 'localhost',
          port: 3000,
          proxy: 'https://localhost:3100/',
          ghostMode: {
            clicks: false,
            location: false,
            forms: false,
            scroll: false,
          },
        },
        {
          reload: false,
        }
      ),
    ],

    devServer: {
      publicPath: '/',
      contentBase: path.resolve('./dist/client'),
      https: true,
      overlay: {
        warnings: false,
        errors: true,
      },
      port: 3100,
      quiet: true,
      historyApiFallback: true,
      stats: {
        assets: false,
        cached: false,
        children: false,
        chunks: true,
        chunkModules: true,
        chunkOrigins: false,
        context: './dist/client/',
        colors: true,
        errors: true,
        errorDetails: true,
        hash: true,
        modules: false,
        modulesSort: 'field',
        publicPath: true,
        reasons: false,
        source: false,
        timings: true,
        version: true,
        warnings: true,
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    },
  });
};
