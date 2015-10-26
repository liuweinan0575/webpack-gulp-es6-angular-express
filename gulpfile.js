var production = (process.env.NODE_ENV == 'production');

var gulp = require('gulp');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var DeepMerge = require('deep-merge');
var colors = require('colors');
var spawn = require('child_process').spawn;
var print = require('gulp-print');
var del = require('del');

var nodemon = require('nodemon');
var WebpackDevServer = require('webpack-dev-server');

var HtmlWebpackPlugin = require('html-webpack-plugin');

var deepmerge = DeepMerge(function(target, source, key) {
  if (target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

// Common Webpack configuration for the frontend and the backend

var defaultConfig = {
  debug: !production,
  devtool: production ? '#source-map' : 'eval',
  module: {
    preLoaders: [{
      loader: 'jshint',
      test: /\.js$/,
      exclude: /node_modules/
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: ['ng-annotate', 'babel']
    }, {
      test: /\.json$/,
      loader: 'json'
    }]
  },
  jshint: {
    // any jshint option http://www.jshint.com/docs/options/
    // i. e.
    camelcase: true,

    // jshint errors are displayed by default as warnings
    // set emitErrors to true to display them as errors
    emitErrors: true,

    // jshint to not interrupt the compilation
    // if you want any file with jshint errors to fail
    // set failOnHint to true
    failOnHint: true,
    globals: {
      __PROD__: false
    }
  },
  plugins: [new webpack.DefinePlugin({
      __PROD__: production
    })]
    .concat(production ? [new webpack.optimize.OccurenceOrderPlugin(true),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ] : [])
}

var config = function(overrides) {
  return deepmerge(defaultConfig, overrides || {});
};

// Webpack configuration for the frontend web application

var frontendConfig = config({
  cache: true,
  resolve: {
    alias: {
      'registerAngularModule': path.resolve(__dirname, 'src/website/utils/registerAngularModule.js')
    }
  },
  entry: {
    vendors: ['angular', 'angular-ui-router',
      'bootstrap', 'bootstrap-webpack', 'jquery',
      'lodash', 'd3'
    ],
    app: (production ? [] : ['webpack/hot/dev-server',
      'webpack-dev-server/client?http://localhost:3000'
    ]).concat(['./src/website/bootstrapApp.js']),
  },
  output: {
    path: path.join(__dirname, 'build/website'),
    filename: production ? "[name].[chunkhash].js" : "[name].js",
    chunkFilename: production ? "[id].[chunkhash].js" : "[id].js"
  },
  module: {
    loaders: [{
        test: /\.html$/,
        loader: 'raw'
      }, {
        test: /\.css$/,
        loader: 'style!css'
      },

      // the url-loader uses DataUrls.
      // the file-loader emits files.
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
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: Infinity
    }),
    new webpack.ProvidePlugin({
      'angular': 'exports?window.angular!angular',
      '$': 'jquery',
      'jQuery': 'jquery',
      '_': 'lodash',
      'registerAngularModule': 'registerAngularModule'
    }),
    new HtmlWebpackPlugin({
      title: 'Webpack Angular Test',
      template: 'src/website/index.tpl.html'
    })
  ].concat(production ? [] : [new webpack.HotModuleReplacementPlugin({
    quiet: true
  })]),
  jshint: {
    esnext: true,
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
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

var backendConfig = config({
  entry: [
    './src/server/main.js'
  ],
  target: 'node',
  output: {
    path: path.join(__dirname, 'build/server'),
    filename: 'backend.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: nodeModules,
  recordsPath: path.join(__dirname, 'build/server/_records'),
  plugins: [
    new webpack.ProvidePlugin({
      '_': 'lodash'
    }),
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true,
      entryOnly: false
    })
  ],
  jshint: {
    // any jshint option http://www.jshint.com/docs/options/
    node: true,
    globals: {
      '_': false
    }
  }
});

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

gulp.task('clean-frontend-build', function(done) {
  del(['build/website/**/*']);
  done();
});

gulp.task('frontend-build', ['clean-frontend-build'], function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

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
  }).listen(3000, 'localhost', function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log('Webpack Dev Server listening at localhost:3000'.green.bold);
    }
    //done(err);
  });

});

gulp.task('clean-backend-build', function(done) {
  del(['build/server/**/*']);
  done();
});

gulp.task('backend-build', ['clean-backend-build'], function(done) {
  webpack(backendConfig).run(onBuild(done));
});

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

gulp.task('build', ['frontend-build', 'backend-build']);

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


gulp.task('run', ['build'], function(done) {
  var server = spawn('./node_modules/.bin/forever', ['./build/server/backend.js'], {
    stdio: "inherit"
  });

  server.on('close', function(code) {
    console.log('Server process exited with code ' + code);
    done();
  });

});

process.once('SIGINT', function() {
  process.exit(0);
});

// ===================================================================================

var prettify = require('gulp-jsbeautifier');

var paths = {
  frontendScripts: ['src/website/**/*.js'],
  backendScripts: ['src/server/**/*.js'],
};


gulp.task('beautify-js', function() {
  gulp.src(paths.frontendScripts.concat(paths.backendScripts).concat(path.join(__dirname, 'gulpfile.js')), {
      base: './'
    })
    .pipe(prettify({
      config: path.join(__dirname, '.jsbeautifyrc'),
      mode: 'VERIFY_AND_WRITE'
    }))
    .pipe(gulp.dest('./'))
});
