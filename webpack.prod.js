const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'production',
  // Do not ship source maps containing the extension source code.
  devtool: false,
});
