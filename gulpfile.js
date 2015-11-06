// Gulp configuration for building a full stack javascript application (server + website)
// trough the use of the awesome module bundler Webpack

// determine if we are in production mode by checking the value of the NODE_ENV environment variable
var appConfig = require('./config');

// require needed node modules
var gulp = require('gulp');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var DeepMerge = require('deep-merge');
var colors = require('colors');
var spawn = require('child_process').spawn;
var del = require('del');

// require the html-webpack-plugin for automatic generation of the index.html file
// of the web application
var HtmlWebpackPlugin = require('html-webpack-plugin');

// require CSS autoprefixer for PostCSS
var autoprefixer = require('autoprefixer');

// dependencies only needed in development mode
if (!appConfig.production) {

  // nodemon for automatically restart the server when its source files
  // have changed
  var nodemon = require('nodemon');
  // webpack-dev-server for hot reloading of the web application when its source files
  // changed
  var WebpackDevServer = require('webpack-dev-server');

}

// extract css in non watch mode (don't extract in watch mode as we want hot reloading of css)
if (!appConfig.watch) {

  // the extract-text-webpack-plugin for extracting stylesheets in a separate css file
  var ExtractTextPlugin = require('extract-text-webpack-plugin');

}

// Utility functions to merge an object into another
var deepmerge = DeepMerge(function(target, source, key) {
  if (target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

var config = function(overrides) {
  return deepmerge(defaultConfig, overrides || {});
};

// Common Webpack configuration for the frontend and the backend
// Webpack documentation can be found at https://webpack.github.io/docs/

var defaultConfig = {
  // set debug to true only in development mode
  debug: !appConfig.production,
  // Developer tool to enhance debugging.
  // In production, a SourceMap is emitted.
  // In development, each module is executed with eval and //@ sourceURL
  devtool: appConfig.production ? '#source-map' : 'eval',

  resolve: {
    // Replace modules by other modules or paths.
    alias: {
      // alias the config file
      'config': path.resolve(__dirname, 'config.js')
    }
  },

  // common module loaders
  module: {

    preLoaders: [
      // apply jshint on all javascript files : perform static code analysis
      // to avoid common errors and embrace best development practices
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'jshint'
      }
    ],

    loaders: [
      // use babel loader in order to use es6 syntax in js files,
      // use ng-annotate loader to automatically inject angular modules dependencies
      // (explicit annotations are needed though with es6 syntax)
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['ng-annotate', 'babel']
      },
      // use json loader to automatically parse JSON files content when importing them
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },
  // any jshint option http://www.jshint.com/docs/options/
  // default configuration is stored in the .jshintrc file
  jshint: {

    // we use es6 syntax
    esnext: true,

    // jshint errors are displayed by default as warnings
    // set emitErrors to true to display them as errors
    emitErrors: true,

    // jshint to not interrupt the compilation
    // if you want any file with jshint errors to fail
    // set failOnHint to true
    failOnHint: true,
    // do not warn about __PROD__ being undefined as it is a global
    // variable added by webpack through the DefinePlugin
    globals: {
      __PROD__: false
    }
  },
  plugins: [
    // define a global __PROD__ variable indicating if the application is
    // executed in production mode or not
    new webpack.DefinePlugin({
      __PROD__: appConfig.production
    })]
    .concat(appConfig.production ?
      // Recommended webpack plugins when building the application for production  :
      [ // Assign the module and chunk ids by occurrence count. Ids that are used often get lower (shorter) ids.
        // This make ids predictable, reduces to total file size and is recommended.
        new webpack.optimize.OccurenceOrderPlugin(true),
        // Search for equal or similar files and deduplicate them in the output.
        // This comes with some overhead for the entry chunk, but can reduce file size effectively.
        new webpack.optimize.DedupePlugin(),
        // Minimize all JavaScript output of chunks. Loaders are switched into minimizing mode.
        // You can pass an object containing UglifyJs options.
        new webpack.optimize.UglifyJsPlugin({
         compress: {
           warnings: false,
         },
         comments: false
      })
     ] : [])
}

// resolve path to minified angular dist
var pathToAngular = path.resolve(__dirname, 'node_modules/angular/angular.min.js');

// Webpack configuration for the frontend Web application
var frontendConfig = config({
  // Cache generated modules and chunks to improve performance for multiple incremental builds.
  cache: true,
  resolve: {
    // Replace modules by other modules or paths.
    alias: {
      // set angular to the minified dist for faster build
      'angular': pathToAngular,
      // alias the registerAngularModule script
      'registerAngularModule': path.resolve(__dirname, 'src/website/utils/registerAngularModule.js')
    },
    // The root directory (absolute path) that contains the application modules,
    // enables to import modules relatively to it
    root: path.resolve(__dirname, 'src/website')
  },
  // Application entry points
  entry: {
    // Generate a vendors bundle containing external modules used in every part of the application.
    // It is a good practice to do so as the code it contains is unlikely to change during the application lifetime.
    // This will allow you to do updates to your application, without requiring the users to download the vendors bundle again
    // See http://dmachat.github.io/angular-webpack-cookbook/Split-app-and-vendors.html for more details
    vendors: ['angular', 'angular-ui-router',
              !appConfig.watch ? './src/node_modules/bootstrap-webpack!./src/website/bootstrap.config.extract.js' :
              './src/node_modules/bootstrap-webpack!./src/website/bootstrap.config.js', 'jquery',
              'lodash'
    ],
    // The frontend application entry point (bootstrapApp.js)
    // In development mode, we also add webpack-dev-server specific entry points
    app: (!appConfig.watch ? [] : ['webpack/hot/dev-server',
      'webpack-dev-server/client?http://localhost:' + appConfig.ports.devServer
    ]).concat(['./src/website/bootstrapApp.js']),
  },
  // The output configuration of the build process
  output: {
    // Directory that will contain the frontend application assets
    // (except when using the webpack-dev-server in development as all generated files are stored in the dev-server memory)
    path: path.join(__dirname, 'build/website'),
    // Patterns of the names of the files to generate.
    // In production, we concatenate the content hash of each file for long term caching
    // See https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95#.rgsrbt29e
    filename: appConfig.production ? "[name].[chunkhash].js" : "[name].js",
    chunkFilename: appConfig.production ? "[id].[chunkhash].js" : "[id].js"
  },
  // Specific module loaders for the frontend
  module: {
    loaders: [
      // Load html files as raw strings
      {
        test: /\.html$/,
        loader: 'raw'
      },
      // Load css files through the PostCSS preprocessor first, then through the classical css and style loader.
      // In production mode, extract all the stylesheets to a separate css file (improve loading performances of the application)
      {
        test: /\.css$/,
        loader: !appConfig.watch ? ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader') : 'style!css!postcss'
      },

      // Loaders for the font files (bootstrap, font-awesome, ...)
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream'
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      }
    ],
    // Disable parsing of the minified angular dist as it is not needed and it speeds up the webpack build
    noParse: [pathToAngular]
  },
  // CSS preprocessor configuration (PostCSS)
  postcss: [
    // use autoprefixer feature (enable to write your CSS rules without vendor prefixes)
    // see https://github.com/postcss/autoprefixer
    autoprefixer()
  ],
  // Webpack plugins used for the frontend
  plugins: [
    // Identifies common modules and put them into a commons chunk (needed to generate the vendors bundle)
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: Infinity
    }),
    // Automatically loaded modules available in all source files of the application
    // (no need to explicitely import them)
    new webpack.ProvidePlugin({
      'angular': 'exports?window.angular!angular',
      '$': 'jquery',
      'jQuery': 'jquery',
      '_': 'lodash',
      'registerAngularModule': 'registerAngularModule'
    }),
    // Automatically generate the index.html file including all webpack generated assets
    new HtmlWebpackPlugin({
      title: 'Webpack Angular Test',
      template: 'src/website/index.tpl.html'
    })
  ].concat(!appConfig.watch ?
  [
    // Extract stylesheets to separate CSS file in production mode
    new ExtractTextPlugin(appConfig.production ? '[name].[contenthash].css' : '[name].css')
  ] :
  [
    // Need to use that plugin in development mode to get hot reloading on source files changes
    new webpack.HotModuleReplacementPlugin({
      quiet: true
    })
  ]),

  // Options for jshint
  jshint: {
    // don't warn about undefined variables as they are provided
    // to the global scope by webpack ProvidePlugin
    globals: {
      '_': false,
      '$': false,
      'jQuery': false,
      'angular': false,
      'registerAngularModule': false
    }
  }
});

// Webpack configuration for the backend server application

var nodeModules = {};
fs.readdirSync('node_modules')
  // Gather all node modules that are not binaries
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  // Creating an object with a key/value of each module name, and prefixing the value with "commonjs".
  // It enables to get the same require behaviour when importing the modules with node when working with webpack
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

var backendConfig = config({
  // Server app entry point
  entry: [
    './src/server/main.js'
  ],
  // Inform webpack that we are targetting node and not the browser
  target: 'node',
  // Backend bundle output configuration
  output: {
    path: path.join(__dirname, 'build/server'),
    filename: 'backend.js'
  },
  // do not freeze __dirname and __filename when bundling with webpack
  node: {
    __dirname: false,
    __filename: false
  },
  // add node modules in externals, they will not be bundled by webpack
  externals: nodeModules,
  // Store/Load compiler state from/to a json file. This will result in persistent ids of modules and chunks.
  // This is required, when using Hot Code Replacement between multiple calls to the compiler.
  recordsPath: path.join(__dirname, 'build/server/_records'),
  // Webpack plugins used for the backend
  plugins: [
    // Provide lodash as global
    new webpack.ProvidePlugin({
      '_': 'lodash',
      '_math' : 'lodash-math'
    }),
    // Insert code at the top of the generated bundle file :
    //  - ensure window is undefined
    //  - add source map support to get a detailed stack trace when an exception is thrown
    new webpack.BannerPlugin('window = undefined; require("source-map-support").install();', {
      raw: true,
      entryOnly: false
    })
  ],
  // jshint configuration for the backend
  jshint: {
    // any jshint option http://www.jshint.com/docs/options/
    node: true,
    globals: {
      '_': false,
      '_math' : false
    }
  }
});

// Callback function called when webpack has terminated a build process
function onBuild(done) {
  return function(err, stats) {
    if (err) {
      console.log(err.red);
    } else {
      console.log(stats.toString({
        colors: true
      }));
    }
    if (done) {
      done();
    }
  }
};

// Gulp task to clean the frontend build
gulp.task('clean-frontend-build', function(done) {
  del(['build/website/**/*']);
  done();
});

// Gulp task to build the frontend bundle
gulp.task('frontend-build', ['clean-frontend-build'], function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

// Gulp task to start a Webpack development server to get hot reloading
// of the frontend when source files change
gulp.task('frontend-watch', ['clean-frontend-build'], function(done) {

  var initialCompile = true;
  var compiler = webpack(frontendConfig);

  compiler.plugin('done', function() {
    if (initialCompile) {
      initialCompile = false;
      done();
    }
  });

  new WebpackDevServer(compiler, {
    contentBase: 'build/website',
    hot: true,
    stats: {
      colors: true
    }
  }).listen(appConfig.ports.devServer, 'localhost', function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(('Webpack Dev Server listening at localhost:' + appConfig.ports.devServer).green.bold);
    }
  });

});

// Gulp task to clean the backend build
gulp.task('clean-backend-build', function(done) {
  del(['build/server/**/*']);
  done();
});

// Gulp task to build the backend bundle
gulp.task('backend-build', ['clean-backend-build'], function(done) {
  webpack(backendConfig).run(onBuild(done));
});

// Gulp task to watch any changes on source files for the backend application.
// The server will be automatically restarted when it happens.
gulp.task('backend-watch', ['clean-backend-build'], function(done) {
  var firedDone = false;
  webpack(backendConfig).watch(100, function(err, stats) {
    onBuild()(err, stats);
    if (!firedDone) {
      firedDone = true;
      done();
    }
    nodemon.restart();
  });
});

// Gulp task to build the frontend and backend bundles
gulp.task('build', ['frontend-build', 'backend-build']);

// Gulp task to start the application in development mode :
// hot reloading of frontend + automatic restart of the backend if needed
gulp.task('watch', ['frontend-watch', 'backend-watch'], function() {
  var firstStart = true;
  nodemon({
    execMap: {
      js: 'node'
    },
    script: path.join(__dirname, 'build/server/backend'),
    ignore: ['*'],
    watch: ['foo/'],
    ext: 'noop'
  }).on('restart', function() {
    if (firstStart) {
      console.log('Starting express server !'.green.bold);
      firstStart = false;
    } else {
      console.log('Restarting express server !'.green.bold);
    }
  });
});

// Gulp task to start the application in production mode :
// the server is launched through the forever utility.
// It allows to automatically restart it when a crash happens.
gulp.task('run', ['build'], function(done) {
  var server = spawn('./node_modules/.bin/forever', ['./build/server/backend.js'], {
    stdio: "inherit"
  });

  server.on('close', function(code) {
    console.log('Server process exited with code ' + code);
    done();
  });

});

// Ensure that all child processes are killed when hitting Ctrl+C in the console
process.once('SIGINT', function() {
  process.exit(0);
});

// ===================================================================================

// Gulp task to beautify js source files trough js-beautify
// Configuration can be found in the .jsbeautifyrc file

var prettify = require('gulp-jsbeautifier');

var paths = {
  frontendScripts: ['src/website/**/*.js'],
  backendScripts: ['src/server/**/*.js'],
};

gulp.task('beautify-js', function() {
  gulp.src(paths.frontendScripts.concat(paths.backendScripts), {
      base: './'
    })
    .pipe(prettify({
      config: path.join(__dirname, '.jsbeautifyrc'),
      mode: 'VERIFY_AND_WRITE'
    }))
    .pipe(gulp.dest('./'))
});
