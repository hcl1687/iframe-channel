const path = require('path')
const src = path.resolve(__dirname, './src')

module.exports = {
  module: {
    rules: [{
      test: /\.js$/,
      include: src,
      use: [{
        loader: 'eslint-loader',
        options: {
          emitWarning: true, // show warning in development, you must solve it
          formatter: require('eslint-friendly-formatter')
        }
      }],
      enforce: 'pre'
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader'
      }]
    }]
  },
  resolve: {
    extensions: ['*', '.js']
  }
}
