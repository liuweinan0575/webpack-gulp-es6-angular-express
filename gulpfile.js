// Gulp configuration for building a full stack javascript application (server + website)
// trough the use of the awesome module bundler Webpack

var argv = require('minimist')(process.argv.slice(2));

if (argv['NODE_ENV'] != null) {
  process.env.NODE_ENV = argv['NODE_ENV'];
}

// determine if we are in production mode by checking the value of the NODE_ENV environment variable
var appConfig = require('./config');

// require needed node modules
var gulp = require('gulp');
var webpack = require('webpack');
var path = require('path');
var DeepMerge = require('deep-merge');
var colors = require('colors');
var spawn = require('child_process').spawn;
var del = require('del');

// Modules required to create a progress bar adding some feedback
// to each compilation performed by webpack
var ProgressPlugin = require('webpack/lib/ProgressPlugin');
var ProgressBar = require('progress');

// dependencies only needed in development mode
if (!appConfig.production) {

  // nodemon for automatically restart the server when its source files
  // have changed
  var nodemon = require('nodemon');
  // webpack-dev-server for hot reloading of the web application when its source files
  // changed
  var WebpackDevServer = require('webpack-dev-server');

}

// Utility functions to merge an object into another
var deepmerge = DeepMerge(function(target, source, key) {
  if (target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

var defaultConfig = require('./webpack.config.common');

var config = function(overrides) {
  return deepmerge(defaultConfig, overrides || {});
};

// Webpack configuration for the frontend Web application
var frontendConfig = config(require('./webpack.config.frontend'));

// Webpack configuration for the backend server application
var backendConfig = config(require('./webpack.config.backend'));

var buildError = false;

// Callback function called when webpack has terminated a build process
function onBuild(done) {
  return function(err, stats) {
    if (err) {
      buildError = true;
      console.log(err.red);
    } else {
      buildError = buildError || stats.compilation.errors.length > 0;
      console.log(stats.toString({
        colors: true
      }));
    }
    if (done) {
      done();
    }
  }
};

// Display a progress bar in the console output when compiling a webpack project
function webpackProgress(compiler, headingMessage) {
  var bar = new ProgressBar(' '+ headingMessage + ' [:bar] :percent : :message', {
    complete: '=',
    incomplete: ' ',
    width: 50,
    total: 100
  });
  var lastPercentage = 0;
  compiler.apply(new ProgressPlugin(function(percentage, msg) {
    if (percentage > lastPercentage) {
      bar.update(percentage, {'message' : msg});
      lastPercentage = percentage;
    } else {
      bar.update(lastPercentage, {'message' : msg});
    }
    if (lastPercentage === 1) {
      lastPercentage = 0;
    }
  }));
}

// Gulp task to build the frontend bundle
gulp.task('frontend-build', function(done) {
  // First, clean the previous frontend build
  del(['build/website/**/*']);
  var compiler = webpack(frontendConfig);
  webpackProgress(compiler, 'Compiling frontend');
  compiler.run(onBuild(done));
});

// Gulp task to start a Webpack development server to get hot reloading
// of the frontend when source files change
gulp.task('frontend-watch', function(done) {
  // First, clean the previous frontend build
  del(['build/website/**/*']);

  var initialCompile = true;
  var compiler = webpack(frontendConfig);
  webpackProgress(compiler, 'Compiling frontend');
  compiler.plugin('done', function(stats) {
    buildError = stats.compilation.errors.length > 0;
    if (initialCompile) {
      console.log(('Webpack Dev Server listening at localhost:' + appConfig.ports.devServer).green.bold);
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
    }
  });

});

// Gulp task to build the backend bundle
gulp.task('backend-build', ['frontend-build'], function(done) {
  // First, clean the previous backend build
  del(['build/server/**/*']);
  var compiler = webpack(backendConfig);
  webpackProgress(compiler, 'Compiling backend');
  compiler.run(onBuild(done));
});

// Gulp task to watch any changes on source files for the backend application.
// The server will be automatically restarted when it happens.
gulp.task('backend-watch', ['frontend-watch'], function(done) {
  // First, clean the previous backend build
  del(['build/server/**/*']);
  var firedDone = false;
  var compiler = webpack(backendConfig);
  webpackProgress(compiler, 'Compiling backend');
  compiler.watch(100, function(err, stats) {
    onBuild()(err, stats);
    if (!firedDone) {
      firedDone = true;
      done();
    }
    nodemon.restart();
  });
});

// Gulp task to build the frontend and backend bundles
gulp.task('build', ['backend-build']);

// Gulp task to start the application in development mode :
// hot reloading of frontend + automatic restart of the backend if needed
gulp.task('watch', ['backend-watch'], function() {
  // Don't start the express server as there was some errors during the webpack compilation
  if (buildError) process.exit();
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
  // Don't start the express server as there was some errors during the webpack compilation
  if (buildError) process.exit();
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
  process.exit();
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
