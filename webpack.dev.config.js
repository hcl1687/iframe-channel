const HtmlWebpackPlugin = require('html-webpack-plugin')
const baseConfig = require('./webpack.base.config')
const fs = require('fs')
const merge = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')

const dist = path.resolve(__dirname, './dist')

const pkgPath = path.resolve(process.cwd(), 'package.json')
const fileContent = fs.readFileSync(pkgPath, 'utf-8')
const pkg = JSON.parse(fileContent)

module.exports = merge(baseConfig, {
  mode: 'development',
  entry: './template/index.dev.js',
  output: {
    path: dist,
    filename: 'index.js'
  },
  devtool: 'inline-source-map',
  devServer: {
    host: 'localhost',
    port: 3000,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './template/index.ejs',
      title: `${pkg.name} ${pkg.description}`
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
})
