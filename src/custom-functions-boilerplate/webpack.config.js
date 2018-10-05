const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: path.resolve('./src/custom-functions-boilerplate'),

  entry: {
    console: ['./dist/custom-functions-boilerplate/console.js'],
  },
  output: {
    filename: './dist/custom-functions-boilerplate/console.g.js',
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      output: {
        beautify: true,
        comments: false,
      },
      mangle: false,
    }),
  ],
};
