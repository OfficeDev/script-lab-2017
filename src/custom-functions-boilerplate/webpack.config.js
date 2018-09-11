const path = require('path');

module.exports = {
  context: path.resolve('./src/custom-functions-boilerplate'),

  entry: {
    console: ['./dist/custom-functions-boilerplate/console.js'],
  },
  output: {
    filename: './dist/console.g.js',
  },
};
