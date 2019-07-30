// Karma configuration
// Generated on Wed Jul 20 2016 14:54:03 GMT+0800 (中国标准时间)
const webpackConfig = require('./webpack.dev.config')
const path = require('path')

module.exports = function (config) {
  const threshold = 0
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'es6-shim', 'es5-shim'],

    // list of files / patterns to load in the browser
    files: [
      './node_modules/phantomjs-polyfill/bind-polyfill.js',
      './node_modules/sinon/pkg/sinon.js',
      {
        pattern: './test/unit/index.js',
        watched: false,
        served: true,
        included: true
      }
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './test/unit/index.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'], // PhantomJS, Chrome, IE

    customLaunchers: {
      IEEDGE: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateEDGE'
      },
      IE10: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE10'
      },
      IE9: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE9'
      },
      IE8: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE8'
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
    coverageReporter: {
      reporters: [{
        type: 'text-summary'
      }, {
        type: 'lcov',
        dir: 'coverage'
      }],
      check: {
        global: {
          statements: threshold,
          branches: threshold,
          functions: threshold,
          lines: threshold
        },
        each: {
          statements: threshold,
          branches: threshold,
          functions: threshold,
          lines: threshold
        }
      }
    },
    webpack: {
      mode: 'development',
      module: webpackConfig.module,
      plugins: webpackConfig.plugins,
      resolve: {
        alias: {
          src: path.resolve(__dirname, './src')
        }
      }
    },
    webpackMiddleware: {
      noInfo: true
    }
  })
}
