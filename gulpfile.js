// Gulp configuration for building a full stack javascript application (server + website)
// trough the use of the awesome module bundler Webpack

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
