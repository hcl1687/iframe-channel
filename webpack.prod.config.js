const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const baseConfig = require('./webpack.base.config')
const merge = require('webpack-merge')
const path = require('path')

const lib = path.resolve(__dirname, './lib')

module.exports = merge(baseConfig, {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: lib,
    filename: 'index.js',
    library: 'IframeChannel',
    libraryTarget: 'umd'
  },
  // devtool: 'eval-source-map',
  optimization: {
    // minimize: false
    minimizer: [new UglifyJsPlugin()]
  }
})
